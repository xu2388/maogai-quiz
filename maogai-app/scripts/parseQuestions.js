const fs = require('fs');
const path = require('path');

const inputFile = path.join('d:/大二下的资料/20260610', '毛概的全部的习题.md');
const outputFile = path.join(__dirname, '../data/questions.json');

// 清理文本中的转义字符
function cleanText(text) {
  return text
    .replace(/\\\(/g, '(')   // \( -> (
    .replace(/\\\)/g, ')')   // \) -> )
    .replace(/\\\./g, '.')    // \. -> .
    .replace(/\\_/g, '_')     // \_ -> _
    .replace(/\\</g, '<')     // \< -> <
    .replace(/\\>/g, '>')     // \> -> >
    .replace(/\\,/g, ',')     // \, -> ,
    .trim();
}

// 解析答案表格格式 |题号|答案|
function parseTableAnswers(text) {
  const answers = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const m = line.match(/\|\s*(\d+)\s*\|\s*([A-D]+)\s*\|/);
    if (m) answers[m[1]] = m[2];
  }
  return answers;
}

// 解析答案列表格式 "1. B" 或 "1. B  "
function parseListAnswers(text) {
  const answers = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const m = line.match(/(\d+)\.\s*([A-D]+)/);
    if (m) answers[m[1]] = m[2];
  }
  return answers;
}

function parseQuestions(content) {
  const chapters = [];

  // 1. 识别所有章节
  // 格式1: # <title> 习题
  // 格式2: # 第七章 "三个代表"重要思想 —— 题目（不含答案）
  // 格式3: # 第八章 科学发展观
  // 使用 [ \t] 代替 \s 避免跨行匹配
  const chapterRegex = /^#[ \t]+(.+?)$/gm;
  const allHeaders = [];
  let match;
  while ((match = chapterRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const lineNum = content.substring(0, match.index).split('\n').length;
    // 排除答案章节
    if (title.includes('参考答案') || title.includes('习题参考答案')) continue;
    // 排除空标题
    if (!title) continue;
    allHeaders.push({ title, startPos: match.index, lineNum });
  }

  console.log(`找到 ${allHeaders.length} 个章节:`);
  allHeaders.forEach(h => console.log(`  ${h.title}`));

  // 2. 提取所有答案
  // 答案格式1 (chapters 0-6): # <title> 参考答案 或 # 导论 习题参考答案
  // 答案格式2 (chapter 7): ### 一\. 单选题答案（共27题）+ 表格
  // 答案格式3 (chapter 8): ### 一\. 单选题答案（共21题）+ 列表

  // 先找 chapters 0-6 的答案
  const answerMap = new Map(); // title -> { number: answer }

  const answerSectionRegex = /^#[ \t]+(.+?)\s*(?:习题)?参考答案\s*$/gm;
  let answerMatch;
  while ((answerMatch = answerSectionRegex.exec(content)) !== null) {
    const answerTitle = answerMatch[1].trim();
    const startPos = answerMatch.index;

    // 找到下一个 # 开头的行作为结束
    let endPos = content.length;
    const afterContent = content.substring(startPos + 1);
    const nextHeader = afterContent.search(/^#\s/m);
    if (nextHeader !== -1) {
      endPos = startPos + 1 + nextHeader;
    }

    const answerSection = content.substring(startPos, endPos);
    const answers = {};

    // 解析单选题答案
    const singleMatch = answerSection.match(/##\s*一、\s*单选题\s*([\s\S]*?)(?=##\s*二|$)/);
    if (singleMatch) {
      Object.assign(answers, parseListAnswers(singleMatch[1]));
    }

    // 解析多选题答案
    const multiMatch = answerSection.match(/##\s*二、\s*多选题\s*([\s\S]*?)(?=##|$)/);
    if (multiMatch) {
      Object.assign(answers, parseListAnswers(multiMatch[1]));
    }

    // 匹配到对应章节
    for (const header of allHeaders) {
      if (header.title.endsWith(answerTitle) || header.title === answerTitle ||
          answerTitle.endsWith(header.title) || header.title.includes(answerTitle)) {
        answerMap.set(header.title, answers);
        console.log(`  答案匹配: "${answerTitle}" -> "${header.title}" (${Object.keys(answers).length}个答案)`);
        break;
      }
    }
  }

  // 3. 解析每个章节的题目
  for (let i = 0; i < allHeaders.length; i++) {
    const { title, startPos } = allHeaders[i];
    const chapterIndex = i;

    // 找到章节内容范围
    let endPos = content.length;
    if (i < allHeaders.length - 1) {
      endPos = allHeaders[i + 1].startPos;
    }

    const chapterContent = content.substring(startPos, endPos);
    const questions = [];

    // 检查是否有内嵌答案（chapters 7, 8）
    let answers = answerMap.get(title) || {};

    // 解析内嵌的单选题答案（### 一\. 单选题答案）
    const embeddedSingleAnswerMatch = chapterContent.match(/###\s*一[\\、.\s]*单选题答案[\s\S]*?(?=###|$)/);
    if (embeddedSingleAnswerMatch) {
      const section = embeddedSingleAnswerMatch[0];
      // 尝试表格格式
      let parsed = parseTableAnswers(section);
      if (Object.keys(parsed).length === 0) {
        parsed = parseListAnswers(section);
      }
      Object.assign(answers, parsed);
      console.log(`  内嵌单选答案: ${Object.keys(parsed).length}个`);
    }

    // 解析内嵌的多选题答案（### 二\. 多选题答案）
    const embeddedMultiAnswerMatch = chapterContent.match(/###\s*二[\\、.\s]*多选题答案[\s\S]*?(?=###|$)/);
    if (embeddedMultiAnswerMatch) {
      const section = embeddedMultiAnswerMatch[0];
      let parsed = parseTableAnswers(section);
      if (Object.keys(parsed).length === 0) {
        parsed = parseListAnswers(section);
      }
      Object.assign(answers, parsed);
      console.log(`  内嵌多选答案: ${Object.keys(parsed).length}个`);
    }

    // 解析单选题 - 支持 ## 和 ### 开头
    // 格式: ## 一、单选题... 或 ### 一、单选题... 或 ### 一\. 单选题...
    const singleRegex = /(?:#{2,3})\s*一[\\、.\s]*单选题[\s\S]*?(?=(?:#{2,3})\s*二[\\、.\s]*多选题|$)/;
    const singleSection = chapterContent.match(singleRegex);
    if (singleSection) {
      const qMatches = [...singleSection[0].matchAll(/(\d+)\.\s*([\s\S]*?)(?=\n\d+\.\s|$)/g)];
      for (const qm of qMatches) {
        const qNum = qm[1];
        const qText = qm[2].trim();
        const lines = qText.split('\n').map(l => l.trim()).filter(l => l);

        if (lines.length < 2) continue;

        const question = cleanText(lines[0]);
        const options = {};

        for (let j = 1; j < lines.length; j++) {
          // 匹配选项: A\. text, A\.text, A. text, A.text
          const om = lines[j].match(/^([A-D])\\?\.\s*(.+)$/);
          if (om) options[om[1]] = cleanText(om[2]);
        }

        if (Object.keys(options).length > 0) {
          questions.push({
            id: `${chapterIndex}-${qNum}`,
            chapter: title,
            chapterIndex,
            number: parseInt(qNum),
            type: 'single',
            question,
            options,
            answer: answers[qNum] || '',
            explanation: ''
          });
        }
      }
    }

    // 解析多选题 - 支持 ## 和 ### 开头
    const multiRegex = /(?:#{2,3})\s*二[\\、.\s]*多选题[\s\S]*?(?=(?:#{2,3})\s*一[\\、.\s]*单选题答案|(?:#{2,3})\s*二[\\、.\s]*多选题答案|---|$)/;
    const multiSection = chapterContent.match(multiRegex);
    if (multiSection) {
      const qMatches = [...multiSection[0].matchAll(/(\d+)\.\s*([\s\S]*?)(?=\n\d+\.\s|$)/g)];
      for (const qm of qMatches) {
        const qNum = qm[1];
        const qText = qm[2].trim();
        const lines = qText.split('\n').map(l => l.trim()).filter(l => l);

        if (lines.length < 2) continue;

        const question = cleanText(lines[0]);
        const options = {};

        for (let j = 1; j < lines.length; j++) {
          const om = lines[j].match(/^([A-D])\\?\.\s*(.+)$/);
          if (om) options[om[1]] = cleanText(om[2]);
        }

        if (Object.keys(options).length > 0) {
          questions.push({
            id: `${chapterIndex}-${qNum}`,
            chapter: title,
            chapterIndex,
            number: parseInt(qNum),
            type: 'multiple',
            question,
            options,
            answer: answers[qNum] || '',
            explanation: ''
          });
        }
      }
    }

    if (questions.length > 0) {
      chapters.push({
        index: chapterIndex,
        title,
        questions: questions.sort((a, b) => a.number - b.number)
      });
    }
  }

  return chapters;
}

// 主程序
console.log('开始解析题目文件...');
console.log('输入文件:', inputFile);

try {
  const content = fs.readFileSync(inputFile, 'utf-8');
  console.log('文件读取成功，大小:', content.length, '字符\n');

  const chapters = parseQuestions(content);
  console.log(`\n解析完成，共 ${chapters.length} 个章节有题目`);

  // 统计信息
  let totalQuestions = 0;
  let singleChoiceCount = 0;
  let multipleChoiceCount = 0;
  let answeredCount = 0;

  for (const chapter of chapters) {
    const single = chapter.questions.filter(q => q.type === 'single').length;
    const multiple = chapter.questions.filter(q => q.type === 'multiple').length;
    const answered = chapter.questions.filter(q => q.answer).length;
    totalQuestions += chapter.questions.length;
    singleChoiceCount += single;
    multipleChoiceCount += multiple;
    answeredCount += answered;

    console.log(`  ${chapter.title}: ${chapter.questions.length} 题 (单选${single}, 多选${multiple}, 有答案${answered})`);
  }

  console.log(`\n总计: ${totalQuestions} 题 (单选${singleChoiceCount}, 多选${multipleChoiceCount})`);
  console.log(`有答案: ${answeredCount} 题, 无答案: ${totalQuestions - answeredCount} 题`);

  // 保存JSON文件
  const output = {
    version: '2.0.0',
    totalChapters: chapters.length,
    totalQuestions,
    singleChoiceCount,
    multipleChoiceCount,
    chapters
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n数据已保存到: ${outputFile}`);

} catch (error) {
  console.error('解析失败:', error);
  console.error(error.stack);
  process.exit(1);
}
