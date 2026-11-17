import { contextBridge, ipcRenderer } from 'electron';
import type { 
  QuestionBank, 
  WrongAnswer, 
  PracticeRecord, 
  ExportFormat 
} from '../shared/types';

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 题库数据
  getQuestionBank: (): Promise<QuestionBank> => 
    ipcRenderer.invoke('get-question-bank'),
  
  // 错题记录
  getWrongAnswers: (): Promise<WrongAnswer[]> => 
    ipcRenderer.invoke('get-wrong-answers'),
  addWrongAnswer: (wrongAnswer: WrongAnswer): Promise<boolean> => 
    ipcRenderer.invoke('add-wrong-answer', wrongAnswer),
  removeWrongAnswer: (questionId: string): Promise<boolean> => 
    ipcRenderer.invoke('remove-wrong-answer', questionId),
  
  // 练习记录
  getPracticeRecords: (): Promise<PracticeRecord[]> => 
    ipcRenderer.invoke('get-practice-records'),
  savePracticeRecord: (record: PracticeRecord): Promise<boolean> => 
    ipcRenderer.invoke('save-practice-record', record),
  
  // 导出错题
  exportWrongAnswers: (format: ExportFormat): Promise<{ success: boolean; message: string; filePath?: string }> => 
    ipcRenderer.invoke('export-wrong-answers', format),
});

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      getQuestionBank: () => Promise<QuestionBank>;
      getWrongAnswers: () => Promise<WrongAnswer[]>;
      addWrongAnswer: (wrongAnswer: WrongAnswer) => Promise<boolean>;
      removeWrongAnswer: (questionId: string) => Promise<boolean>;
      getPracticeRecords: () => Promise<PracticeRecord[]>;
      savePracticeRecord: (record: PracticeRecord) => Promise<boolean>;
      exportWrongAnswers: (format: ExportFormat) => Promise<{ success: boolean; message: string; filePath?: string }>;
    };
  }
}
