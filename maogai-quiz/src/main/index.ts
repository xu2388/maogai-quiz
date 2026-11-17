import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import type { QuestionBank, WrongAnswer, PracticeRecord, ExportFormat } from '../shared/types';

// 保持窗口对象的全局引用
let mainWindow: BrowserWindow | null = null;

// 数据存储路径
const userDataPath = app.getPath('userData');
const wrongAnswersPath = path.join(userDataPath, 'wrong-answers.json');
const recordsPath = path.join(userDataPath, 'practice-records.json');

// 清理转义字符
function unescapeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\\./g, '.')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\*/g, '*')
    .replace(/\\_/g, '_')
    .replace(/\\\-/g, '-')
    .replace(/\\\+/g, '+')
    .replace(/\\\?/g, '?')
    .replace(/\\\!/g, '!')
    .replace(/\\\#/g, '#')
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\\|/g, '|')
    .replace(/\\\^/g, '^')
    .replace(/\\\$/g, '$')
    .replace(/\\,/g, ',')
    .replace(/\\\\/g, '\\')
    .trim();
}

// 加载题库数据
function loadQuestionBank(): QuestionBank {
  // 尝试多个可能的路径
  const possiblePaths = [
    path.join(__dirname, '../../data/questions.json'),  // 开发环境
    path.join(process.resourcesPath, 'data/questions.json'),  // 打包后
    path.join(app.getAppPath(), 'data/questions.json'),  // 备选
  ];

  for (const dataPath of possiblePaths) {
    try {
      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`尝试加载 ${dataPath} 失败:`, error);
    }
  }

  throw new Error('无法找到题库数据文件');
}

// 加载错题记录
function loadWrongAnswers(): WrongAnswer[] {
  try {
    if (fs.existsSync(wrongAnswersPath)) {
      const data = fs.readFileSync(wrongAnswersPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载错题记录失败:', error);
  }
  return [];
}

// 保存错题记录
function saveWrongAnswers(wrongAnswers: WrongAnswer[]) {
  try {
    fs.writeFileSync(wrongAnswersPath, JSON.stringify(wrongAnswers, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存错题记录失败:', error);
  }
}

// 加载练习记录
function loadPracticeRecords(): PracticeRecord[] {
  try {
    if (fs.existsSync(recordsPath)) {
      const data = fs.readFileSync(recordsPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载练习记录失败:', error);
  }
  return [];
}

// 保存练习记录
function savePracticeRecords(records: PracticeRecord[]) {
  try {
    fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存练习记录失败:', error);
  }
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // 加载应用
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用就绪
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) {
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

// 获取题库数据
ipcMain.handle('get-question-bank', () => {
  return loadQuestionBank();
});

// 获取错题记录
ipcMain.handle('get-wrong-answers', () => {
  return loadWrongAnswers();
});

// 添加错题（更新 wrongCount）
ipcMain.handle('add-wrong-answer', (_, wrongAnswer: WrongAnswer) => {
  const wrongAnswers = loadWrongAnswers();
  const existingIndex = wrongAnswers.findIndex(wa => wa.questionId === wrongAnswer.questionId);

  if (existingIndex >= 0) {
    // 更新已有错题：累加 wrongCount
    wrongAnswers[existingIndex].wrongCount++;
    wrongAnswers[existingIndex].lastWrongTime = Date.now();
    wrongAnswers[existingIndex].userAnswer = wrongAnswer.userAnswer;
  } else {
    // 添加新错题
    wrongAnswers.push({
      ...wrongAnswer,
      wrongCount: 1,
      lastWrongTime: Date.now(),
    });
  }

  saveWrongAnswers(wrongAnswers);
  return true;
});

// 移除错题
ipcMain.handle('remove-wrong-answer', (_, questionId: string) => {
  const wrongAnswers = loadWrongAnswers();
  const filtered = wrongAnswers.filter(wa => wa.questionId !== questionId);
  saveWrongAnswers(filtered);
  return true;
});

// 获取练习记录
ipcMain.handle('get-practice-records', () => {
  return loadPracticeRecords();
});

// 保存练习记录
ipcMain.handle('save-practice-record', (_, record: PracticeRecord) => {
  const records = loadPracticeRecords();
  records.push(record);
  savePracticeRecords(records);
  return true;
});

// 导出错题（清理转义字符）
ipcMain.handle('export-wrong-answers', async (_, format: ExportFormat) => {
  const wrongAnswers = loadWrongAnswers();

  if (wrongAnswers.length === 0) {
    return { success: false, message: '没有错题记录' };
  }

  const { filePath } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: `错题记录_${new Date().toISOString().split('T')[0]}.${format}`,
    filters: format === 'md'
      ? [{ name: 'Markdown', extensions: ['md'] }]
      : [{ name: 'Text', extensions: ['txt'] }],
  });

  if (!filePath) {
    return { success: false, message: '用户取消' };
  }

  let content = '';

  if (format === 'md') {
    content = '# 错题记录\n\n';
    content += `导出时间: ${new Date().toLocaleString()}\n\n`;
    content += `共 ${wrongAnswers.length} 道错题\n\n`;

    wrongAnswers.forEach((wa, index) => {
      content += `## ${index + 1}. ${unescapeText(wa.question.question)}\n\n`;
      content += `**章节**: ${unescapeText(wa.question.chapter)}\n\n`;
      content += `**题型**: ${wa.question.type === 'single' ? '单选题' : '多选题'}\n\n`;
      content += '**选项**:\n\n';
      Object.entries(wa.question.options).forEach(([key, value]) => {
        content += `- ${key}. ${unescapeText(value)}\n`;
      });
      content += `\n**正确答案**: ${wa.question.answer}\n\n`;
      content += `**你的答案**: ${wa.userAnswer}\n\n`;
      content += `**错误次数**: ${wa.wrongCount}\n\n`;
      content += '---\n\n';
    });
  } else {
    content = '错题记录\n';
    content += `导出时间: ${new Date().toLocaleString()}\n`;
    content += `共 ${wrongAnswers.length} 道错题\n\n`;

    wrongAnswers.forEach((wa, index) => {
      content += `${index + 1}. ${unescapeText(wa.question.question)}\n`;
      content += `   章节: ${unescapeText(wa.question.chapter)}\n`;
      content += `   题型: ${wa.question.type === 'single' ? '单选题' : '多选题'}\n`;
      Object.entries(wa.question.options).forEach(([key, value]) => {
        content += `   ${key}. ${unescapeText(value)}\n`;
      });
      content += `   正确答案: ${wa.question.answer}\n`;
      content += `   你的答案: ${wa.userAnswer}\n`;
      content += `   错误次数: ${wa.wrongCount}\n\n`;
    });
  }

  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, message: '导出成功', filePath };
  } catch (error) {
    return { success: false, message: `导出失败: ${error}` };
  }
});
