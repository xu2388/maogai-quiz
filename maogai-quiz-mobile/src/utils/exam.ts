import type { Question, QuestionBank } from '../types';
import type { QuestionOptionMapping, ExamMapping } from '../types';

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

  const chapterQuestions: Question[][] = chapters.map(ch =>
    ch.questions.filter(q => q.type === type)
  );

  const totalAvailable = chapterQuestions.reduce((sum, list) => sum + list.length, 0);
  if (totalAvailable === 0) return [];

  const result: Question[] = [];
  let remaining = totalNeeded;

  const basePerChapter = Math.floor(totalNeeded / chapterCount);
  const quotas: number[] = chapterQuestions.map(() => basePerChapter);
  remaining -= basePerChapter * chapterCount;

  const sortedIndices = chapterQuestions
    .map((list, idx) => ({ idx, count: list.length }))
    .sort((a, b) => b.count - a.count)
    .map(item => item.idx);

  for (let i = 0; i < remaining; i++) {
    quotas[sortedIndices[i % chapterCount]] += 1;
  }

  for (let i = 0; i < chapterCount; i++) {
    const available = chapterQuestions[i].length;
    const take = Math.min(quotas[i], available);
    const shuffled = shuffleArray(chapterQuestions[i]);
    result.push(...shuffled.slice(0, take));
  }

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
  const keyMap: Record<string, string> = {};

  shuffledKeys.forEach((originalKey, idx) => {
    const newKey = String.fromCharCode(65 + idx);
    newOptions[newKey] = question.options[originalKey];
    keyMap[newKey] = originalKey;
  });

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

// 根据用户答案还原为原始答案
export function restoreOriginalAnswer(examMapping: ExamMapping, questionId: string, userAnswer: string): string {
  const mapping = examMapping.mappings[questionId];
  if (!mapping) return userAnswer;

  return userAnswer
    .split('')
    .map(key => mapping.keyMap[key] || key)
    .sort()
    .join('');
}