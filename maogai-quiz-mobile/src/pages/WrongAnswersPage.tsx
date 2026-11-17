import { useState } from 'react';
import { Download, Trash2, AlertCircle, FileText, FileCode, Share2 } from 'lucide-react';
import { useStore } from '../store';
import { exportWrongAnswersText } from '../api';

export default function WrongAnswersPage() {
  const { wrongAnswers, questionBanks, currentSubject, removeWrongAnswer, clearWrongAnswers } = useStore();
  const questionBank = questionBanks[currentSubject];
  const [exportMsg, setExportMsg] = useState('');

  const handleExport = (format: 'txt' | 'md') => {
    const content = exportWrongAnswersText(format);
    if (!content) {
      setExportMsg('没有错题可导出');
      setTimeout(() => setExportMsg(''), 3000);
      return;
    }

    // 使用 Clipboard API 复制到剪贴板
    const filename = `错题本_${new Date().toISOString().slice(0, 10)}.${format}`;
    const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg(`已导出: ${filename}`);
    setTimeout(() => setExportMsg(''), 5000);
  };

  const getQuestion = (chapterIndex: number, questionId: string) => {
    const ch = questionBank?.chapters.find(c => c.index === chapterIndex);
    return ch?.questions.find(q => q.id === questionId);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">错题本</h1>
        <p className="page-subtitle">
          共 {wrongAnswers.length} 道错题
          {wrongAnswers.length > 0 && (
            <span style={{ marginLeft: 8 }}>
              累计错误 {wrongAnswers.reduce((s, w) => s + w.wrongCount, 0)} 次
            </span>
          )}
        </p>
      </div>

      {wrongAnswers.length > 0 && (
        <div className="action-bar">
          <button className="btn btn-secondary" onClick={() => handleExport('md')}>
            <FileCode size={15} /> 导出 MD
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('txt')}>
            <FileText size={15} /> 导出 TXT
          </button>
          <button className="btn btn-danger" onClick={() => {
            if (confirm('确定要清空所有错题吗？')) clearWrongAnswers();
          }}>
            <Trash2 size={15} /> 清空
          </button>
        </div>
      )}

      {exportMsg && (
        <div style={{
          padding: '10px 16px', background: '#e8f9ed', borderRadius: 10,
          color: '#34c759', fontSize: 13, marginBottom: 12,
        }}>
          {exportMsg}
        </div>
      )}

      {wrongAnswers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><AlertCircle size={56} /></div>
          <div className="empty-state-text">暂无错题，继续加油！</div>
        </div>
      ) : (
        <div className="wrong-list">
          {wrongAnswers
            .sort((a, b) => b.wrongCount - a.wrongCount)
            .map((wa, i) => {
              const q = getQuestion(wa.chapterIndex, wa.questionId);
              if (!q) return null;
              const chapter = questionBank?.chapters.find(c => c.index === wa.chapterIndex);

              return (
                <div key={wa.questionId} className="wrong-item">
                  <div className="wrong-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#aeaeb2' }}>#{i + 1}</span>
                      <span className="chapter-badge">{chapter?.title || ''}</span>
                      {wa.wrongCount > 1 && (
                        <span className="wrong-count-badge">
                          <AlertCircle size={11} /> 错 {wa.wrongCount} 次
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => removeWrongAnswer(wa.questionId)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10, lineHeight: 1.6 }}>
                    {q.question}
                  </div>

                  <div className="options-list" style={{ marginBottom: 10 }}>
                    {Object.entries(q.options).map(([key, text]) => {
                      const isCorrect = q.answer.includes(key);
                      const isUser = wa.userAnswer.includes(key);
                      let cls = 'option-item';
                      if (isCorrect) cls += ' correct';
                      else if (isUser) cls += ' wrong';
                      return (
                        <div key={key} className={cls} style={{ cursor: 'default', fontSize: 13, padding: '8px 12px' }}>
                          <span className="option-key">{key}</span>
                          <span className="option-text">{text}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: 12, color: '#6e6e73', display: 'flex', gap: 12 }}>
                    <span>正确: <strong style={{ color: '#34c759' }}>{q.answer}</strong></span>
                    <span>你的: <strong style={{ color: '#ff3b30' }}>{wa.userAnswer}</strong></span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}