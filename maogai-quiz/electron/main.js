const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f5f5f7',
  });

  // 开发环境加载 dev server，生产环境加载打包文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// 数据存储路径
function getDataDir() {
  const userDataDir = app.getPath('userData');
  const dataDir = path.join(userDataDir, 'quiz-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

// 考试映射记录
function getExamMappingsDir() {
  const dir = path.join(getDataDir(), 'exam-mappings');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getExamMappingPath(examId) {
  return path.join(getExamMappingsDir(), `${examId}.json`);
}

function saveExamMapping(mapping) {
  try {
    const p = getExamMappingPath(mapping.examId);
    fs.writeFileSync(p, JSON.stringify(mapping, null, 2), 'utf-8');
    // 同时保存为 latest.json
    const latestPath = path.join(getExamMappingsDir(), 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(mapping, null, 2), 'utf-8');
    return { success: true, path: p };
  } catch (e) {
    console.error('保存考试映射失败:', e);
    return { success: false, error: e.message };
  }
}

function getLatestExamMapping() {
  try {
    const latestPath = path.join(getExamMappingsDir(), 'latest.json');
    if (fs.existsSync(latestPath)) {
      return JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
    }
  } catch (e) {
    console.error('加载考试映射失败:', e);
  }
  return null;
}

// 加载题库
function loadQuestionBank() {
  const possiblePaths = [
    path.join(__dirname, '../data/questions.json'),
    path.join(process.resourcesPath, 'data/questions.json'),
    path.join(app.getAppPath(), 'data/questions.json'),
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const data = fs.readFileSync(p, 'utf-8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('加载题库失败:', p, e);
    }
  }
  return null;
}

// 错题记录
function getWrongAnswersPath() {
  return path.join(getDataDir(), 'wrong-answers.json');
}

function loadWrongAnswers() {
  try {
    const p = getWrongAnswersPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch (e) {
    console.error('加载错题失败:', e);
  }
  return [];
}

function saveWrongAnswers(data) {
  try {
    fs.writeFileSync(getWrongAnswersPath(), JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('保存错题失败:', e);
  }
}

// 练习记录
function getRecordsPath() {
  return path.join(getDataDir(), 'records.json');
}

function loadRecords() {
  try {
    const p = getRecordsPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch (e) {
    console.error('加载记录失败:', e);
  }
  return [];
}

function saveRecords(data) {
  try {
    fs.writeFileSync(getRecordsPath(), JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('保存记录失败:', e);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理
const ipc = ipcMain;

ipc.handle('load-question-bank', () => {
  return loadQuestionBank();
});

ipc.handle('get-wrong-answers', () => {
  return loadWrongAnswers();
});

ipc.handle('save-wrong-answers', (event, data) => {
  saveWrongAnswers(data);
  return true;
});

ipc.handle('add-wrong-answer', (event, wrongAnswer) => {
  const answers = loadWrongAnswers();
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
  saveWrongAnswers(answers);
  return answers;
});

ipc.handle('remove-wrong-answer', (event, questionId) => {
  const answers = loadWrongAnswers();
  const filtered = answers.filter(a => a.questionId !== questionId);
  saveWrongAnswers(filtered);
  return filtered;
});

ipc.handle('clear-wrong-answers', () => {
  saveWrongAnswers([]);
  return [];
});

ipc.handle('get-records', () => {
  return loadRecords();
});

ipc.handle('save-record', (event, record) => {
  const records = loadRecords();
  records.unshift(record);
  // 最多保留 100 条记录
  if (records.length > 100) records.length = 100;
  saveRecords(records);
  return records;
});

ipc.handle('save-exam-mapping', (event, mapping) => {
  return saveExamMapping(mapping);
});

ipc.handle('get-latest-exam-mapping', () => {
  return getLatestExamMapping();
});

ipc.handle('export-wrong-answers', async (event, format) => {
  const answers = loadWrongAnswers();
  const questionBank = loadQuestionBank();
  
  let content = '';
  if (format === 'md') {
    content = '# 错题本导出\n\n';
    content += `导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    answers.forEach((wa, i) => {
      const ch = questionBank?.chapters.find(c => c.index === wa.chapterIndex);
      const q = ch?.questions.find(q => q.id === wa.questionId);
      if (!q) return;
      content += `## ${i + 1}. ${wa.wrongCount > 1 ? `【错${wa.wrongCount}次】` : ''}\n\n`;
      content += `**章节：** ${ch?.title || ''}\n\n`;
      content += `**题目：** ${q.question}\n\n`;
      Object.entries(q.options).forEach(([k, v]) => {
        const isCorrect = q.answer.includes(k);
        const isUser = wa.userAnswer.includes(k);
        content += `- ${k}. ${v}${isCorrect ? ' ✅' : ''}${isUser && !isCorrect ? ' ❌' : ''}\n`;
      });
      content += `\n**正确答案：** ${q.answer}\n\n`;
      content += `**你的答案：** ${wa.userAnswer}\n\n`;
      content += '---\n\n';
    });
  } else {
    content = '错题本导出\n';
    content += `导出时间：${new Date().toLocaleString('zh-CN')}\n`;
    content += `${'='.repeat(60)}\n\n`;
    answers.forEach((wa, i) => {
      const ch = questionBank?.chapters.find(c => c.index === wa.chapterIndex);
      const q = ch?.questions.find(q => q.id === wa.questionId);
      if (!q) return;
      content += `${i + 1}. ${wa.wrongCount > 1 ? `【错${wa.wrongCount}次】` : ''}\n`;
      content += `章节：${ch?.title || ''}\n`;
      content += `题目：${q.question}\n`;
      Object.entries(q.options).forEach(([k, v]) => {
        content += `  ${k}. ${v}\n`;
      });
      content += `正确答案：${q.answer}\n`;
      content += `你的答案：${wa.userAnswer}\n`;
      content += `${'-'.repeat(60)}\n\n`;
    });
  }

  const ext = format === 'md' ? 'md' : 'txt';
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出错题本',
    defaultPath: `错题本_${new Date().toISOString().slice(0, 10)}.${ext}`,
    filters: [{ name: format === 'md' ? 'Markdown' : 'Text', extensions: [ext] }],
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});
