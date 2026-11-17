export interface Question {
  id: string;
  chapter: string;
  chapterIndex: number;
  number: number;
  type: 'single' | 'multiple';
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
}

export interface Chapter {
  index: number;
  title: string;
  questions: Question[];
}

export interface QuestionBank {
  version: string;
  totalChapters: number;
  totalQuestions: number;
  singleChoiceCount: number;
  multipleChoiceCount: number;
  chapters: Chapter[];
}

export interface WrongAnswer {
  questionId: string;
  chapterIndex: number;
  question: Question;
  userAnswer: string;
  wrongCount: number;
  lastWrongTime: number;
}

export interface UserAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

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

// 选项映射
export interface QuestionOptionMapping {
  originalId: string;
  originalAnswer: string;
  newAnswer: string;
  keyMap: Record<string, string>;
}

// 一场考试的完整映射记录
export interface ExamMapping {
  examId: string;
  createdAt: number;
  pattern: string;
  questionCount: number;
  mappings: Record<string, QuestionOptionMapping>;
}

export type QuizMode = 'practice' | 'exam';
export type AnswerMode = 'immediate' | 'delayed';
