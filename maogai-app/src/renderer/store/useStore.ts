import { create } from 'zustand';
import type { 
  QuestionBank, 
  Chapter, 
  Question, 
  WrongAnswer, 
  PracticeRecord,
  UserAnswer 
} from '../../shared/types';

interface AppState {
  // 数据
  questionBank: QuestionBank | null;
  wrongAnswers: WrongAnswer[];
  practiceRecords: PracticeRecord[];
  
  // 当前状态
  currentChapter: Chapter | null;
  currentQuestions: Question[];
  currentQuestionIndex: number;
  userAnswers: Map<string, UserAnswer>;
  mode: 'practice' | 'exam' | null;
  answerMode: 'immediate' | 'delayed';
  startTime: number;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // 动作
  loadData: () => Promise<void>;
  setCurrentChapter: (chapter: Chapter | null) => void;
  setCurrentQuestions: (questions: Question[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setMode: (mode: 'practice' | 'exam' | null) => void;
  setAnswerMode: (mode: 'immediate' | 'delayed') => void;
  answerQuestion: (questionId: string, answer: string, isCorrect: boolean) => void;
  startQuiz: () => void;
  finishQuiz: () => Promise<PracticeRecord | null>;
  resetQuiz: () => void;
  addWrongAnswer: (wrongAnswer: WrongAnswer) => Promise<void>;
  removeWrongAnswer: (questionId: string) => Promise<void>;
  exportWrongAnswers: (format: 'txt' | 'md') => Promise<{ success: boolean; message: string; filePath?: string }>;
}

export const useStore = create<AppState>((set, get) => ({
  // 初始状态
  questionBank: null,
  wrongAnswers: [],
  practiceRecords: [],
  currentChapter: null,
  currentQuestions: [],
  currentQuestionIndex: 0,
  userAnswers: new Map(),
  mode: null,
  answerMode: 'immediate',
  startTime: 0,
  isLoading: false,
  error: null,
  
  // 加载数据
  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [questionBank, wrongAnswers, practiceRecords] = await Promise.all([
        window.electronAPI.getQuestionBank(),
        window.electronAPI.getWrongAnswers(),
        window.electronAPI.getPracticeRecords(),
      ]);
      set({ 
        questionBank, 
        wrongAnswers, 
        practiceRecords, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载数据失败', 
        isLoading: false 
      });
    }
  },
  
  // 设置当前章节
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  
  // 设置当前题目
  setCurrentQuestions: (questions) => set({ 
    currentQuestions: questions,
    currentQuestionIndex: 0,
    userAnswers: new Map(),
  }),
  
  // 设置当前题目索引
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  
  // 设置模式
  setMode: (mode) => set({ mode }),
  
  // 设置答题模式
  setAnswerMode: (mode) => set({ answerMode: mode }),
  
  // 答题
  answerQuestion: (questionId, answer, isCorrect) => {
    const { userAnswers } = get();
    const newAnswers = new Map(userAnswers);
    newAnswers.set(questionId, {
      questionId,
      userAnswer: answer,
      isCorrect,
      answerTime: Date.now(),
    });
    set({ userAnswers: newAnswers });
  },
  
  // 开始答题
  startQuiz: () => set({ 
    startTime: Date.now(),
    currentQuestionIndex: 0,
    userAnswers: new Map(),
  }),
  
  // 完成答题
  finishQuiz: async () => {
    const { 
      currentChapter, 
      currentQuestions, 
      userAnswers, 
      mode, 
      answerMode, 
      startTime 
    } = get();
    
    if (!mode || currentQuestions.length === 0) return null;
    
    const endTime = Date.now();
    const answers = Array.from(userAnswers.values());
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;
    const score = Math.round((correctCount / currentQuestions.length) * 100);
    
    const record: PracticeRecord = {
      id: Date.now().toString(),
      chapterIndex: currentChapter ? currentChapter.index : -1,
      chapterTitle: currentChapter ? currentChapter.title : '考试模式（随机抽题）',
      mode,
      answerMode,
      questionCount: currentQuestions.length,
      correctCount,
      wrongCount,
      score,
      startTime,
      endTime,
      answers,
    };
    
    await window.electronAPI.savePracticeRecord(record);
    
    // 更新本地记录
    const records = await window.electronAPI.getPracticeRecords();
    set({ practiceRecords: records });
    
    return record;
  },
  
  // 重置答题
  resetQuiz: () => set({
    currentQuestions: [],
    currentQuestionIndex: 0,
    userAnswers: new Map(),
    mode: null,
    startTime: 0,
  }),
  
  // 添加错题
  addWrongAnswer: async (wrongAnswer) => {
    await window.electronAPI.addWrongAnswer(wrongAnswer);
    const wrongAnswers = await window.electronAPI.getWrongAnswers();
    set({ wrongAnswers });
  },
  
  // 移除错题
  removeWrongAnswer: async (questionId) => {
    await window.electronAPI.removeWrongAnswer(questionId);
    const wrongAnswers = await window.electronAPI.getWrongAnswers();
    set({ wrongAnswers });
  },
  
  // 导出错题
  exportWrongAnswers: async (format) => {
    return await window.electronAPI.exportWrongAnswers(format);
  },
}));
