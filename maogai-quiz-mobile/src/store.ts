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
  SubjectKey,
} from './types';
import * as api from './api';

interface StoreState {
  currentSubject: SubjectKey;
  questionBanks: Record<SubjectKey, QuestionBank | null>;
  loaded: boolean;
  currentQuestions: Question[];
  currentIndex: number;
  userAnswers: Map<string, UserAnswer>;
  mode: QuizMode | null;
  answerMode: AnswerMode;
  startTime: number;
  currentChapterTitle: string;
  examMapping: ExamMapping | null;
  wrongAnswers: WrongAnswer[];
  records: PracticeRecord[];

  loadData: () => void;
  setSubject: (key: SubjectKey) => void;
  startQuiz: (questions: Question[], mode: QuizMode, answerMode: AnswerMode, chapterTitle: string, examMapping?: ExamMapping) => void;
  answerQuestion: (questionId: string, answer: string, isCorrect: boolean) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishQuiz: () => PracticeRecord | null;
  addWrongAnswer: (wrong: WrongAnswer) => void;
  removeWrongAnswer: (questionId: string) => void;
  clearWrongAnswers: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  currentSubject: 'maogai',
  questionBanks: { maogai: null, mayuan: null },
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
    try {
      const savedSubject = (typeof localStorage !== 'undefined'
        ? (localStorage.getItem('current_subject') as SubjectKey | null)
        : null) || 'maogai';
      api.setStorageSubject(savedSubject);

      const maogaiBank = (await import('../data/questions.json')).default as unknown as QuestionBank;
      const mayuanBank = (await import('../data/questions-mayuan.json')).default as unknown as QuestionBank;

      const wrong = api.getWrongAnswers();
      const records = api.getRecords();
      set({
        currentSubject: savedSubject,
        questionBanks: { maogai: maogaiBank, mayuan: mayuanBank },
        wrongAnswers: wrong,
        records: records,
        loaded: true,
      });
    } catch (e) {
      console.error('加载数据失败:', e);
      set({ loaded: true });
    }
  },

  setSubject: (key: SubjectKey) => {
    api.setStorageSubject(key);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('current_subject', key);
    }
    const wrong = api.getWrongAnswers();
    const records = api.getRecords();
    set({
      currentSubject: key,
      wrongAnswers: wrong,
      records: records,
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

  finishQuiz: () => {
    const { currentQuestions, userAnswers, mode, answerMode, startTime, currentChapterTitle } = get();
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

    const records = api.saveRecord(record);
    set({ records });
    return record;
  },

  addWrongAnswer: (wrong) => {
    const updated = api.addWrongAnswer(wrong);
    set({ wrongAnswers: updated });
  },

  removeWrongAnswer: (questionId) => {
    const updated = api.removeWrongAnswer(questionId);
    set({ wrongAnswers: updated });
  },

  clearWrongAnswers: () => {
    api.clearWrongAnswers();
    set({ wrongAnswers: [] });
  },
}));