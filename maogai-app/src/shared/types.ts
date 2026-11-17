// 题目类型
export type QuestionType = 'single' | 'multiple';

// 选项
export interface Option {
  key: string;
  text: string;
}

// 题目
export interface Question {
  id: string;
  chapter: string;
  chapterIndex: number;
  number: number;
  type: QuestionType;
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
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

// 用户答案
export interface UserAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  answerTime: number;
}

// 应用状态
export interface AppState {
  currentChapter: number | null;
  mode: 'practice' | 'exam' | null;
  answerMode: 'immediate' | 'delayed';
}

// 练习设置
export interface PracticeSettings {
  chapterIndex: number;
  answerMode: 'immediate' | 'delayed';
  questionCount?: number;
}

// 考试设置
export interface ExamSettings {
  questionCount: number;
  timeLimit?: number; // 分钟
}

// 导出格式
export type ExportFormat = 'txt' | 'md';
