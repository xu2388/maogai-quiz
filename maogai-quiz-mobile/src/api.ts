// 移动端数据存储层 —— 替代 Electron IPC
// 使用 localStorage 存储所有用户数据

import type { WrongAnswer, PracticeRecord, ExamMapping, SubjectKey } from './types';

function storageKeysFor(subject: SubjectKey) {
  const prefix = subject === 'maogai' ? 'maogai' : 'mayuan';
  return {
    wrongAnswers: `${prefix}_wrong_answers`,
    records: `${prefix}_records`,
    examMappings: `${prefix}_exam_mappings`,
    latestExamMapping: `${prefix}_latest_exam_mapping`,
  };
}

let currentSubject: SubjectKey = 'maogai';
export function setStorageSubject(subject: SubjectKey) {
  currentSubject = subject;
}
export function getStorageSubject(): SubjectKey {
  return currentSubject;
}

const STORAGE_KEYS = () => storageKeysFor(currentSubject);

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存储满时清理旧记录
    if (key === STORAGE_KEYS().records) {
      const records = safeGet<PracticeRecord[]>(STORAGE_KEYS().records, []);
      if (records.length > 50) {
        safeSet(STORAGE_KEYS().records, records.slice(0, 50));
      }
    }
  }
}

// 错题操作
export function getWrongAnswers(): WrongAnswer[] {
  return safeGet<WrongAnswer[]>(STORAGE_KEYS().wrongAnswers, []);
}

export function addWrongAnswer(wrongAnswer: WrongAnswer): WrongAnswer[] {
  const answers = getWrongAnswers();
  const idx = answers.findIndex(a => a.questionId === wrongAnswer.questionId);
  if (idx >= 0) {
    answers[idx].wrongCount += 1;
    answers[idx].lastWrongTime = Date.now();
    answers[idx].userAnswer = wrongAnswer.userAnswer;
  } else {
    answers.push({
      ...wrongAnswer,
      wrongCount: 1,
      lastWrongTime: Date.now(),
    });
  }
  safeSet(STORAGE_KEYS().wrongAnswers, answers);
  return answers;
}

export function removeWrongAnswer(questionId: string): WrongAnswer[] {
  const answers = getWrongAnswers().filter(a => a.questionId !== questionId);
  safeSet(STORAGE_KEYS().wrongAnswers, answers);
  return answers;
}

export function clearWrongAnswers(): void {
  safeSet(STORAGE_KEYS().wrongAnswers, []);
}

// 练习记录
export function getRecords(): PracticeRecord[] {
  return safeGet<PracticeRecord[]>(STORAGE_KEYS().records, []);
}

export function saveRecord(record: PracticeRecord): PracticeRecord[] {
  const records = getRecords();
  records.unshift(record);
  if (records.length > 100) records.length = 100;
  safeSet(STORAGE_KEYS().records, records);
  return records;
}

// 考试映射
export function saveExamMapping(mapping: ExamMapping): void {
  const mappings = safeGet<ExamMapping[]>(STORAGE_KEYS().examMappings, []);
  mappings.unshift(mapping);
  if (mappings.length > 20) mappings.length = 20;
  safeSet(STORAGE_KEYS().examMappings, mappings);
  safeSet(STORAGE_KEYS().latestExamMapping, mapping);
}

export function getLatestExamMapping(): ExamMapping | null {
  return safeGet<ExamMapping | null>(STORAGE_KEYS().latestExamMapping, null);
}

// 导出错题为文本
export function exportWrongAnswersText(format: 'txt' | 'md'): string {
  const answers = getWrongAnswers();
  if (answers.length === 0) return '';

  let content = '';
  if (format === 'md') {
    content = '# 错题本\n\n';
    content += `导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    answers.forEach((wa, i) => {
      content += `## ${i + 1}. ${wa.wrongCount > 1 ? `【错${wa.wrongCount}次】` : ''}\n\n`;
      content += `**题目：** ${wa.question.question}\n\n`;
      Object.entries(wa.question.options).forEach(([k, v]) => {
        const isCorrect = wa.question.answer.includes(k);
        const isUser = wa.userAnswer.includes(k);
        content += `- ${k}. ${v}${isCorrect ? ' ✅' : ''}${isUser && !isCorrect ? ' ❌' : ''}\n`;
      });
      content += `\n**正确答案：** ${wa.question.answer}\n\n`;
      content += `**你的答案：** ${wa.userAnswer}\n\n`;
      content += '---\n\n';
    });
  } else {
    content = '错题本\n';
    content += `导出时间：${new Date().toLocaleString('zh-CN')}\n`;
    content += `${'='.repeat(60)}\n\n`;
    answers.forEach((wa, i) => {
      content += `${i + 1}. ${wa.wrongCount > 1 ? `【错${wa.wrongCount}次】` : ''}\n`;
      content += `题目：${wa.question.question}\n`;
      Object.entries(wa.question.options).forEach(([k, v]) => {
        content += `  ${k}. ${v}\n`;
      });
      content += `正确答案：${wa.question.answer}\n`;
      content += `你的答案：${wa.userAnswer}\n`;
      content += `${'-'.repeat(60)}\n\n`;
    });
  }
  return content;
}