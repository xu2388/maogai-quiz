import { create } from 'zustand';
import type {
  Question,
  QuestionBank,
  WrongAnswer,
  PracticeRecord,
  UserAnswer,
  ExportFormat,
} from '../../shared/types';

// ===== 类型定义 =====
export type Mode = 'practice' | 'exam';
export type AnswerMode = 'immediate' | 'delayed';

export interface ExportResult {
  success: boolean;
  message: string;
  filePath?: string;
}

// ===== Store 类型 =====
interface StoreState {
  // 状态
  questionBank: QuestionBank | null;
  wrongAnswers: WrongAnswer[];
  practiceRecords: PracticeRecord[];
  currentQuestions: Question[];
  currentIndex: number;
  userAnswers: Map<string, string>;
  mode: Mode;
  answerMode: AnswerMode;
  startTime: number | null;
  currentChapter: number | null;

  // 动作
  loadData: () => Promise<void>;
  setCurrentChapter: (index: number | null) => void;
  setCurrentQuestions: (questions: Question[]) => void;
  setMode: (mode: Mode) => void;
  setAnswerMode: (mode: AnswerMode) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  startQuiz: (questions: Question[], chapterIndex: number | null) => void;
  finishQuiz: () => PracticeRecord | null;
  resetQuiz: () => void;
  addWrongAnswer: (question: Question, userAnswer: string) => void;
  removeWrongAnswer: (questionId: string) => void;
  exportWrongAnswers: (format?: ExportFormat) => Promise<ExportResult>;
}

// ===== Store 实现 =====
export const useStore = create<StoreState>((set, get) => ({
  // 初始状态
  questionBank: null,
  wrongAnswers: [],
  practiceRecords: [],
  currentQuestions: [],
  currentIndex: 0,
  userAnswers: new Map(),
  mode: 'practice',
  answerMode: 'immediate',
  startTime: null,
  currentChapter: null,

  // 加载数据
  loadData: async () => {
    try {
      let bank: QuestionBank | null = null;

      if (window.electronAPI?.getQuestionBank) {
        bank = await window.electronAPI.getQuestionBank();
      }

      if (!bank) {
        const res = await fetch('/data/questions.json');
        bank = await res.json();
      }

      const wrong = window.electronAPI?.getWrongAnswers
        ? await window.electronAPI.getWrongAnswers()
        : [];

      const records = window.electronAPI?.getPracticeRecords
        ? await window.electronAPI.getPracticeRecords()
        : [];

      set({
        questionBank: bank,
        wrongAnswers: wrong || [],
        practiceRecords: records || [],
      });
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  },

  setCurrentChapter: (index) => set({ currentChapter: index }),
  setCurrentQuestions: (questions) => set({ currentQuestions: questions }),
  setMode: (mode) => set({ mode }),
  setAnswerMode: (mode) => set({ answerMode: mode }),

  answerQuestion: (questionId, answer) => {
    const newAnswers = new Map(get().userAnswers);
    newAnswers.set(questionId, answer);
    set({ userAnswers: newAnswers });
  },

  startQuiz: (questions, chapterIndex) => {
    set({
      currentQuestions: questions,
      currentIndex: 0,
      userAnswers: new Map(),
      startTime: Date.now(),
      currentChapter: chapterIndex,
    });
  },

  finishQuiz: () => {
    const state = get();
    const { currentQuestions, userAnswers, mode, currentChapter, startTime, questionBank, answerMode } = state;
    if (!currentQuestions.length || !startTime) return null;

    const endTime = Date.now();
    const answers: UserAnswer[] = [];
    let correctCount = 0;
    let wrongCount = 0;

    for (const q of currentQuestions) {
      const userAns = userAnswers.get(q.id) || '';
      const isCorrect = userAns === q.answer;
      if (isCorrect) {
        correctCount++;
      } else if (userAns) {
        wrongCount++;
      }
      answers.push({
        questionId: q.id,
        userAnswer: userAns,
        isCorrect,
        answerTime: endTime,
      });
    }

    const questionCount = currentQuestions.length;
    const score = Math.round((correctCount / questionCount) * 100);

    // 考试模式 currentChapter 为 null，使用 -1 表示全部章节
    const chapterIndex = currentChapter !== null ? currentChapter : -1;
    const chapterTitle = currentChapter !== null
      ? questionBank?.chapters.find(c => c.index === currentChapter)?.title || ''
      : '全部章节';

    const record: PracticeRecord = {
      id: `${Date.now()}`,
      chapterIndex,
      chapterTitle,
      mode,
      answerMode,
      questionCount,
      correctCount,
      wrongCount,
      score,
      startTime,
      endTime,
      answers,
    };

    // 保存记录到 electronAPI
    if (window.electronAPI?.savePracticeRecord) {
      window.electronAPI.savePracticeRecord(record);
    }

    // 添加错题并更新本地状态
    const updatedWrong = [...state.wrongAnswers];
    for (const q of currentQuestions) {
      const userAns = userAnswers.get(q.id) || '';
      if (userAns && userAns !== q.answer) {
        const wrongAnswer: WrongAnswer = {
          questionId: q.id,
          question: q,
          userAnswer: userAns,
          wrongCount: 1,
          lastWrongTime: Date.now(),
        };
        // 通过 electronAPI 添加错题（主进程会处理 wrongCount 累加）
        if (window.electronAPI?.addWrongAnswer) {
          window.electronAPI.addWrongAnswer(wrongAnswer);
        }
        // 更新本地状态
        const existingIndex = updatedWrong.findIndex(w => w.questionId === q.id);
        if (existingIndex >= 0) {
          updatedWrong[existingIndex] = {
            ...updatedWrong[existingIndex],
            wrongCount: updatedWrong[existingIndex].wrongCount + 1,
            lastWrongTime: Date.now(),
            userAnswer: userAns,
          };
        } else {
          updatedWrong.push(wrongAnswer);
        }
      }
    }

    set({
      practiceRecords: [...state.practiceRecords, record],
      wrongAnswers: updatedWrong,
    });

    return record;
  },

  resetQuiz: () => {
    set({
      currentQuestions: [],
      currentIndex: 0,
      userAnswers: new Map(),
      startTime: null,
      currentChapter: null,
    });
  },

  addWrongAnswer: (question, userAnswer) => {
    const wrongAnswer: WrongAnswer = {
      questionId: question.id,
      question,
      userAnswer,
      wrongCount: 1,
      lastWrongTime: Date.now(),
    };
    // 通过 electronAPI 添加错题
    if (window.electronAPI?.addWrongAnswer) {
      window.electronAPI.addWrongAnswer(wrongAnswer);
    }
    // 更新本地状态
    const existing = get().wrongAnswers;
    const existingIndex = existing.findIndex(w => w.questionId === question.id);
    if (existingIndex >= 0) {
      const updated = [...existing];
      updated[existingIndex] = {
        ...updated[existingIndex],
        wrongCount: updated[existingIndex].wrongCount + 1,
        lastWrongTime: Date.now(),
        userAnswer,
      };
      set({ wrongAnswers: updated });
    } else {
      set({ wrongAnswers: [...existing, wrongAnswer] });
    }
  },

  removeWrongAnswer: (questionId) => {
    // 通过 electronAPI 移除错题
    if (window.electronAPI?.removeWrongAnswer) {
      window.electronAPI.removeWrongAnswer(questionId);
    }
    // 更新本地状态
    set({ wrongAnswers: get().wrongAnswers.filter(w => w.questionId !== questionId) });
  },

  exportWrongAnswers: async (format: ExportFormat = 'md') => {
    if (window.electronAPI?.exportWrongAnswers) {
      return await window.electronAPI.exportWrongAnswers(format);
    }
    return { success: false, message: 'electronAPI 不可用' };
  },
}));
