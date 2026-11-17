import { useState } from 'react';
import { Download, Trash2, AlertCircle, FileText, FileCode } from 'lucide-react';
import { useStore } from '../store';

export default function WrongAnswersPage() {
  const { wrongAnswers, questionBank, removeWrongAnswer, clearWrongAnswers } = useStore();
  const [exportMsg, setExportMsg] = useState('');

  const handleExport = async (format: 'txt' | 'md') => {
    const result = await window.electronAPI.exportWrongAnswers(format);
    if (result.success) {
      setExportMsg(`已导出到: ${result.path}`);
      setTimeout(() => setExportMsg(''), 5000);
    }
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
            <span style={{ marginLeft: 12 }}>
              累计错误 {wrongAnswers.reduce((s, w) => s + w.wrongCount, 0)} 次
            </span>
          )}
        </p>
      </div>

      {/* 操作栏 */}
      {wrongAnswers.length > 0 && (
        <div className="action-bar">
          <button className="btn btn-secondary" onClick={() => handleExport('md')}>
            <FileCode size={16} /> 导出 Markdown
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('txt')}>
            <FileText size={16} /> 导出 TXT
          </button>
          <button className="btn btn-danger" onClick={() => {
            if (confirm('确定要清空所有错题吗？')) clearWrongAnswers();
          }}>
            <Trash2 size={16} /> 清空错题
          </button>
        </div>
      )}

      {exportMsg && (
        <div style={{
          padding: '12px 20px', background: '#e8f9ed', borderRadius: 12,
          color: '#34c759', fontSize: 14, marginBottom: 16
        }}>
          {exportMsg}
        </div>
      )}

      {/* 错题列表 */}
      {wrongAnswers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <AlertCircle size={64} />
          </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#aeaeb2' }}>#{i + 1}</span>
                      <span className="chapter-badge">{chapter?.title || ''}</span>
                      {wa.wrongCount > 1 && (
                        <span className="wrong-count-badge">
                          <AlertCircle size={12} /> 错 {wa.wrongCount} 次
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 13 }}
                      onClick={() => removeWrongAnswer(wa.questionId)}
                    >
                      <Trash2 size={14} /> 移除
                    </button>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, lineHeight: 1.6 }}>
                    {q.question}
                  </div>

                  <div className="options-list" style={{ marginBottom: 12 }}>
                    {Object.entries(q.options).map(([key, text]) => {
                      const isCorrect = q.answer.includes(key);
                      const isUser = wa.userAnswer.includes(key);
                      let cls = 'option-item';
                      if (isCorrect) cls += ' correct';
                      else if (isUser) cls += ' wrong';
                      return (
                        <div key={key} className={cls} style={{ cursor: 'default', fontSize: 14, padding: '10px 14px' }}>
                          <span className="option-key">{key}</span>
                          <span className="option-text">{text}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: 13, color: '#6e6e73', display: 'flex', gap: 16 }}>
                    <span>正确答案: <strong style={{ color: '#34c759' }}>{q.answer}</strong></span>
                    <span>你的答案: <strong style={{ color: '#ff3b30' }}>{wa.userAnswer}</strong></span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
