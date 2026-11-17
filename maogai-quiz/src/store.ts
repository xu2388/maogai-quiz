import { create } from 'zustand';
import type {
  QuestionBank,
  Question,
  WrongAnswer,
  PracticeRecord,
  UserAnswer,
  QuizMode,
  AnswerMode,
  ExamMapping,
} from './types';

interface StoreState {
  // 题库
  questionBank: QuestionBank | null;
  loaded: boolean;

  // 答题状态
  currentQuestions: Question[];
  currentIndex: number;
  userAnswers: Map<string, UserAnswer>;
  mode: QuizMode | null;
  answerMode: AnswerMode;
  startTime: number;
  currentChapterTitle: string;
  examMapping: ExamMapping | null;

  // 错题
  wrongAnswers: WrongAnswer[];

  // 记录
  records: PracticeRecord[];

  // Actions
  loadData: () => Promise<void>;
  startQuiz: (questions: Question[], mode: QuizMode, answerMode: AnswerMode, chapterTitle: string, examMapping?: ExamMapping) => void;
  setExamMapping: (mapping: ExamMapping | null) => void;
  answerQuestion: (questionId: string, answer: string, isCorrect: boolean) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishQuiz: () => Promise<PracticeRecord | null>;
  addWrongAnswer: (wrong: WrongAnswer) => void;
  removeWrongAnswer: (questionId: string) => void;
  clearWrongAnswers: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  questionBank: null,
  loaded: false,
  currentQuestions: [],
  currentIndex: 0,
  userAnswers: new Map(),
  mode: null,
  answerMode: 'immediate',
  startTime: 0,
  currentChapterTitle: '',
  examMapping: null,
  wrongAnswers: [],
  records: [],

  loadData: async () => {
    if (get().loaded) return;
    
    const bank = await window.electronAPI.loadQuestionBank();
    const wrong = await window.electronAPI.getWrongAnswers();
    const records = await window.electronAPI.getRecords();
    
    set({
      questionBank: bank,
      wrongAnswers: wrong,
      records: records,
      loaded: true,
    });
  },

  startQuiz: (questions, mode, answerMode, chapterTitle, examMapping) => {
    set({
      currentQuestions: questions,
      currentIndex: 0,
      userAnswers: new Map(),
      mode,
      answerMode,
      startTime: Date.now(),
      currentChapterTitle: chapterTitle,
      examMapping: examMapping || null,
    });
  },

  setExamMapping: (mapping) => {
    set({ examMapping: mapping });
  },

  answerQuestion: (questionId, answer, isCorrect) => {
    const { userAnswers } = get();
    const newAnswers = new Map(userAnswers);
    newAnswers.set(questionId, { questionId, userAnswer: answer, isCorrect });
    set({ userAnswers: newAnswers });
  },

  nextQuestion: () => {
    const { currentIndex, currentQuestions } = get();
    if (currentIndex < currentQuestions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  finishQuiz: async () => {
    const {
      currentQuestions,
      userAnswers,
      mode,
      answerMode,
      startTime,
      currentChapterTitle,
    } = get();

    if (!mode || currentQuestions.length === 0) return null;

    const answers = Array.from(userAnswers.values());
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = currentQuestions.length - correctCount;
    const score = Math.round((correctCount / currentQuestions.length) * 100);

    const record: PracticeRecord = {
      id: Date.now().toString(),
      chapterIndex: -1,
      chapterTitle: currentChapterTitle,
      mode,
      answerMode,
      questionCount: currentQuestions.length,
      correctCount,
      wrongCount,
      score,
      startTime,
      endTime: Date.now(),
      answers,
    };

    await window.electronAPI.saveRecord(record);
    const records = await window.electronAPI.getRecords();
    set({ records });
    return record;
  },

  addWrongAnswer: (wrong) => {
    window.electronAPI.addWrongAnswer(wrong).then((updated) => {
      set({ wrongAnswers: updated });
    });
  },

  removeWrongAnswer: (questionId) => {
    window.electronAPI.removeWrongAnswer(questionId).then((updated) => {
      set({ wrongAnswers: updated });
    });
  },

  clearWrongAnswers: () => {
    window.electronAPI.clearWrongAnswers().then(() => {
      set({ wrongAnswers: [] });
    });
  },
}));
