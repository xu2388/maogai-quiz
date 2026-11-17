// 题目类型
export type QuestionType = 'single' | 'multiple';

// 题目
export interface Question {
  id: string;
  globalId: number;
  chapter: string;
  chapterIndex: number;
  number: number;
  type: QuestionType;
  question: string;
  options: Record<string, string>;
  answer: string;
}

// 章节
export interface Chapter {
  index: number;
  title: string;
  questions: Question[];
}

// 题库数据
export interface QuestionBank {
  version: string;
  totalChapters: number;
  totalQuestions: number;
  singleChoiceCount: number;
  multipleChoiceCount: number;
  chapters: Chapter[];
}

// 错题记录
export interface WrongAnswer {
  questionId: string;
  question: Question;
  userAnswer: string;
  wrongCount: number;
  lastWrongTime: number;
}

// 用户答案
export interface UserAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  answerTime: number;
}

// 练习记录
export interface PracticeRecord {
  id: string;
  chapterIndex: number;
  chapterTitle: string;
  mode: 'practice' | 'exam';
  answerMode: 'immediate' | 'delayed';
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  startTime: number;
  endTime: number;
  answers: UserAnswer[];
}

// 导出格式
export type ExportFormat = 'txt' | 'md';
