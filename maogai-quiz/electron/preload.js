const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadQuestionBank: () => ipcRenderer.invoke('load-question-bank'),
  getWrongAnswers: () => ipcRenderer.invoke('get-wrong-answers'),
  addWrongAnswer: (data) => ipcRenderer.invoke('add-wrong-answer', data),
  removeWrongAnswer: (id) => ipcRenderer.invoke('remove-wrong-answer', id),
  clearWrongAnswers: () => ipcRenderer.invoke('clear-wrong-answers'),
  getRecords: () => ipcRenderer.invoke('get-records'),
  saveRecord: (record) => ipcRenderer.invoke('save-record', record),
  exportWrongAnswers: (format) => ipcRenderer.invoke('export-wrong-answers', format),
  saveExamMapping: (mapping) => ipcRenderer.invoke('save-exam-mapping', mapping),
  getLatestExamMapping: () => ipcRenderer.invoke('get-latest-exam-mapping'),
});
