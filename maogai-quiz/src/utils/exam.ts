import type { Question, QuestionBank, Chapter } from '../types';

// 选项映射：记录某道题在考试中选项顺序被打乱后的对应关系
export interface QuestionOptionMapping {
  originalId: string; // 原始题目 id
  originalAnswer: string; // 原始答案（如 "B"）
  newAnswer: string; // 打乱后正确答案对应的 key（如 "A"）
  keyMap: Record<string, string>; // 新 key -> 原始 key 的映射
}

// 一场考试的完整映射记录
export interface ExamMapping {
  examId: string; // 考试批次 id
  createdAt: number;
  pattern: string; // 考试模式描述
  questionCount: number;
  mappings: Record<string, QuestionOptionMapping>; // key 为打乱后的新题目 id（originalId_examId）
}

// 打乱数组（Fisher-Yates）
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 从章节中均匀采样指定数量的题目
export function sampleQuestionsByChapter(
  bank: QuestionBank,
  type: 'single' | 'multiple',
  totalNeeded: number
): Question[] {
  const chapters = bank.chapters;
  const chapterCount = chapters.length;
  if (chapterCount === 0) return [];

  // 按章节收集该类型的题目
  const chapterQuestions: Question[][] = chapters.map(ch =>
    ch.questions.filter(q => q.type === type)
  );

  const totalAvailable = chapterQuestions.reduce((sum, list) => sum + list.length, 0);
  if (totalAvailable === 0) return [];

  const result: Question[] = [];
  let remaining = totalNeeded;

  // 第一轮：每章至少分配 floor(totalNeeded / chapterCount) 道
  const basePerChapter = Math.floor(totalNeeded / chapterCount);
  const quotas: number[] = chapterQuestions.map(() => basePerChapter);
  remaining -= basePerChapter * chapterCount;

  // 第二轮：将余数按题目数量多的章节优先分配
  const sortedIndices = chapterQuestions
    .map((list, idx) => ({ idx, count: list.length }))
    .sort((a, b) => b.count - a.count)
    .map(item => item.idx);

  for (let i = 0; i < remaining; i++) {
    quotas[sortedIndices[i % chapterCount]] += 1;
  }

  // 实际抽取
  for (let i = 0; i < chapterCount; i++) {
    const available = chapterQuestions[i].length;
    const take = Math.min(quotas[i], available);
    const shuffled = shuffleArray(chapterQuestions[i]);
    result.push(...shuffled.slice(0, take));
  }

  // 如果还有不足，从所有该类型题目中补充
  if (result.length < totalNeeded) {
    const usedIds = new Set(result.map(q => q.id));
    const allOfType = chapters.flatMap(ch => ch.questions).filter(q => q.type === type && !usedIds.has(q.id));
    const supplement = shuffleArray(allOfType).slice(0, totalNeeded - result.length);
    result.push(...supplement);
  }

  return shuffleArray(result);
}

// 生成选项乱序的题目副本
export function shuffleQuestionOptions(
  question: Question,
  newId: string
): { shuffledQuestion: Question; mapping: QuestionOptionMapping } {
  const originalKeys = Object.keys(question.options);
  const shuffledKeys = shuffleArray(originalKeys);

  const newOptions: Record<string, string> = {};
  const keyMap: Record<string, string> = {}; // 新 key -> 原始 key

  shuffledKeys.forEach((originalKey, idx) => {
    const newKey = String.fromCharCode(65 + idx); // A, B, C, D...
    newOptions[newKey] = question.options[originalKey];
    keyMap[newKey] = originalKey;
  });

  // 计算新的正确答案
  const newAnswer = question.answer
    .split('')
    .map(originalKey => {
      const entry = Object.entries(keyMap).find(([_, orig]) => orig === originalKey);
      return entry ? entry[0] : originalKey;
    })
    .sort()
    .join('');

  const mapping: QuestionOptionMapping = {
    originalId: question.id,
    originalAnswer: question.answer,
    newAnswer,
    keyMap,
  };

  const shuffledQuestion: Question = {
    ...question,
    id: newId,
    options: newOptions,
    answer: newAnswer,
  };

  return { shuffledQuestion, mapping };
}

// 生成一场完整的考试
export function generateExam(
  bank: QuestionBank,
  pattern: string,
  singleCount: number,
  multipleCount: number
): {
  examId: string;
  questions: Question[];
  mapping: ExamMapping;
} {
  const examId = `exam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const singleQuestions = sampleQuestionsByChapter(bank, 'single', singleCount);
  const multipleQuestions = sampleQuestionsByChapter(bank, 'multiple', multipleCount);

  const allSelected = shuffleArray([...singleQuestions, ...multipleQuestions]);

  const mappings: Record<string, QuestionOptionMapping> = {};
  const shuffledQuestions: Question[] = [];

  allSelected.forEach((q, idx) => {
    const newId = `${q.id}_${examId}_${idx}`;
    const { shuffledQuestion, mapping } = shuffleQuestionOptions(q, newId);
    shuffledQuestions.push(shuffledQuestion);
    mappings[newId] = mapping;
  });

  const mapping: ExamMapping = {
    examId,
    createdAt: Date.now(),
    pattern,
    questionCount: shuffledQuestions.length,
    mappings,
  };

  return { examId, questions: shuffledQuestions, mapping };
}

// 根据用户答案（基于打乱后的 key）还原为原始答案
export function restoreOriginalAnswer(examMapping: ExamMapping, questionId: string, userAnswer: string): string {
  const mapping = examMapping.mappings[questionId];
  if (!mapping) return userAnswer;

  return userAnswer
    .split('')
    .map(key => mapping.keyMap[key] || key)
    .sort()
    .join('');
}
