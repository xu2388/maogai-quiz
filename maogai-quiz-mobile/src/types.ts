// 题目类型
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
  chapterIndex: number;
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
export type SubjectKey = 'maogai' | 'mayuan';

export interface SubjectMeta {
  key: SubjectKey;
  name: string;
  shortName: string;
  subtitle: string;
  icon: string;
  color: string;
}

export const SUBJECTS: Record<SubjectKey, SubjectMeta> = {
  maogai: {
    key: 'maogai',
    name: '毛概',
    shortName: '毛',
    subtitle: '毛泽东思想和中国特色社会主义理论体系概论',
    icon: 'Book',
    color: '#0071e3',
  },
  mayuan: {
    key: 'mayuan',
    name: '马原',
    shortName: '马',
    subtitle: '马克思主义基本原理',
    icon: 'Target',
    color: '#ff3b30',
  },
};