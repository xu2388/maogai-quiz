const fs = require('fs');
const path = require('path');

const mdContent = fs.readFileSync(
  path.join(__dirname, '../../毛概的全部的习题.md'),
  'utf-8'
);

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\\\./g, '.').replace(/\\\(/g, '(').replace(/\\\)/g, ')')
    .replace(/\\\*/g, '*').replace(/\\\-/g, '-').replace(/\\\+/g, '+')
    .replace(/\\\?/g, '?').replace(/\\\!/g, '!').replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']').replace(/\\\{/g, '{').replace(/\\\}/g, '}')
    .replace(/\\\|/g, '|').replace(/\\\^/g, '^').replace(/\\\$/g, '$')
    .replace(/\\\\/g, '\\').replace(/\\_/g, '_').replace(/\\>/g, '>')
    .replace(/\\</g, '<').replace(/\\~/g, '~').replace(/\\`/g, '`')
    .trim();
}

const lines = mdContent.split('\n');
const chapters = [];
let currentChapter = null;
let currentSection = null;
let currentType = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // 跳过空行开头的 #
  if (!trimmed || trimmed === '#') continue;

  // 检测答案区域标题（优先检测，避免误判为章节）
  // 格式: # 导论 习题参考答案  或  ### 一. 单选题答案  或  ### 一\. 单选题答案（共21题）
  if (
    trimmed.match(/^#\s+.+参考答案/) ||
    trimmed.match(/^###?\s+.+答案/) ||
    trimmed.match(/^###?\s+.+\.?\s*单选题答案/) ||
    trimmed.match(/^###?\s+.+\.?\s*多选题答案/)
  ) {
    currentSection = 'answers';
    continue;
  }

  // 检测章节标题
  // 排除：答案区域、分隔线、说明文字
  if (trimmed.startsWith('# ') && !trimmed.includes('参考答案')) {
    // 提取标题文本
    let title = trimmed.replace(/^#\s+/, '').trim();
    
    // 去掉末尾的 "习题"
    title = title.replace(/\s+习题\s*$/, '').trim();
    // 去掉末尾的 "—— 题目（不含答案）" 等
    title = title.replace(/\s+——\s*题目.*$/, '').trim();
    
    // 跳过无意义标题
    if (!title || title.length < 2) continue;
    // 跳过说明性文字
    if (title.startsWith('以下是') || title.startsWith('好的') || title.startsWith('---')) continue;
    
    currentChapter = {
      title: title,
      questions: [],
      answers: {}
    };
    chapters.push(currentChapter);
    currentSection = 'questions';
    currentType = null;
    continue;
  }

  // 检测题目类型标题
  // ## 一、单选题\(共10 题\)  或  ### 一、单选题（共27题）  或  ### 一\. 单选题（共21题）
  const typeMatch = trimmed.match(/^(?:#{2,3})\s+[一二三四五六七八九十]+\s*[\.．、\\]*\s*(单选题|多选题)/);
  if (typeMatch) {
    currentType = typeMatch[1] === '单选题' ? 'single' : 'multiple';
    continue;
  }

  // 题目区域
  if (currentSection === 'questions' && currentChapter && currentType) {
    // 题目行: 1. xxx 或 1\. xxx
    const qMatch = trimmed.match(/^(\d+)\s*[\.．、]\s*(.+)/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      const qText = cleanText(qMatch[2]);
      currentChapter.questions.push({
        number: qNum,
        type: currentType,
        question: qText,
        options: {},
        answer: ''
      });
      continue;
    }

    // 选项行: A\. xxx 或 A. xxx
    const optMatch = trimmed.match(/^([A-D])\s*[\.．、]\s*(.+)/);
    if (optMatch && currentChapter.questions.length > 0) {
      const key = optMatch[1];
      const val = cleanText(optMatch[2]);
      currentChapter.questions[currentChapter.questions.length - 1].options[key] = val;
      continue;
    }
  }

  // 答案区域
  if (currentSection === 'answers' && currentChapter) {
    // 格式1: 1. B  或  1\. B  或  1\. B  
    const ansMatch = trimmed.match(/^(\d+)\s*[\.．、]?\s*([A-D]+)\s*$/);
    if (ansMatch) {
      const qNum = parseInt(ansMatch[1]);
      const ans = ansMatch[2];
      currentChapter.answers[qNum] = ans;
      continue;
    }

    // 格式2（表格）: |1|C| 或 |1|C|  
    const tableMatch = trimmed.match(/^\|(\d+)\|([A-D]+)\|/);
    if (tableMatch) {
      const qNum = parseInt(tableMatch[1]);
      const ans = tableMatch[2];
      currentChapter.answers[qNum] = ans;
      continue;
    }
  }
}

// 将答案匹配到题目
for (const chapter of chapters) {
  for (const q of chapter.questions) {
    if (chapter.answers[q.number]) {
      q.answer = chapter.answers[q.number];
    }
  }
}

// 过滤无效章节
const validChapters = chapters.filter(ch => ch.questions.length > 0);

// 设置索引
validChapters.forEach((ch, idx) => {
  ch.index = idx;
  ch.questions.forEach(q => {
    q.chapterIndex = idx;
    q.chapter = ch.title;
    q.id = `${idx}-${q.number}`;
  });
});

// 统计
const totalQuestions = validChapters.reduce((sum, ch) => sum + ch.questions.length, 0);
const singleCount = validChapters.reduce((sum, ch) => sum + ch.questions.filter(q => q.type === 'single').length, 0);
const multipleCount = validChapters.reduce((sum, ch) => sum + ch.questions.filter(q => q.type === 'multiple').length, 0);

// 输出结果
console.log('=== 题库解析结果 ===');
console.log(`总章节数: ${validChapters.length}`);
console.log(`总题目数: ${totalQuestions}`);
console.log(`单选题: ${singleCount}, 多选题: ${multipleCount}`);
console.log('');
validChapters.forEach(ch => {
  const sc = ch.questions.filter(q => q.type === 'single').length;
  const mc = ch.questions.filter(q => q.type === 'multiple').length;
  const noAnswer = ch.questions.filter(q => !q.answer).length;
  console.log(`第${ch.index + 1}章: ${ch.title}`);
  console.log(`  共${ch.questions.length}题 (单选${sc}, 多选${mc})${noAnswer > 0 ? `, ⚠${noAnswer}题无答案!` : ' ✓'}`);
});

// 保存JSON
const output = {
  version: '2.0.0',
  totalChapters: validChapters.length,
  totalQuestions,
  singleChoiceCount: singleCount,
  multipleChoiceCount: multipleCount,
  chapters: validChapters.map(ch => ({
    index: ch.index,
    title: ch.title,
    questions: ch.questions.map(q => ({
      id: q.id, chapter: q.chapter, chapterIndex: q.chapterIndex,
      number: q.number, type: q.type, question: q.question,
      options: q.options, answer: q.answer, explanation: ''
    }))
  }))
};

const outputPath = path.join(__dirname, '../data/questions.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`\n题库已保存到: ${outputPath}`);
