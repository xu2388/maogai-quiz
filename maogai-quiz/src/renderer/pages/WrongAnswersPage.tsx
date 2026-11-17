import { Download, Trash2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import './WrongAnswersPage.css';

const WrongAnswersPage = () => {
  const wrongAnswers = useStore((s) => s.wrongAnswers);
  const exportWrongAnswers = useStore((s) => s.exportWrongAnswers);
  const removeWrongAnswer = useStore((s) => s.removeWrongAnswer);

  const handleExport = async (format: 'txt' | 'md') => {
    const result = await exportWrongAnswers(format);
    if (result.success) {
      alert(`导出成功: ${result.filePath}`);
    } else {
      alert(result.message);
    }
  };

  // 空状态提示
  if (wrongAnswers.length === 0) {
    return (
      <div className="empty-page">
        <AlertCircle size={64} className="empty-icon" />
        <h2 className="empty-title">暂无错题</h2>
        <p className="empty-desc">快去练习吧，错题会自动记录在这里</p>
      </div>
    );
  }

  return (
    <div className="wrong-answers-page">
      <div className="page-header">
        <h1 className="page-title">错题本</h1>
        <p className="page-subtitle">共 {wrongAnswers.length} 道错题</p>
        <div className="export-buttons">
          <button className="export-btn" onClick={() => handleExport('txt')}>
            <Download size={16} />
            导出 TXT
          </button>
          <button className="export-btn" onClick={() => handleExport('md')}>
            <Download size={16} />
            导出 Markdown
          </button>
        </div>
      </div>

      <div className="wrong-answers-list">
        {wrongAnswers.map((wa, index) => {
          const question = wa.question;
          return (
            <div key={wa.questionId} className="wrong-answer-card">
              <div className="wrong-answer-header">
                <span className="question-index">{index + 1}</span>
                <span className="chapter-tag">{question.chapter}</span>
                <span className="wrong-count">错 {wa.wrongCount} 次</span>
                <button
                  className="delete-btn"
                  onClick={() => removeWrongAnswer(wa.questionId)}
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="question-text">{question.question}</p>
              <div className="options-list">
                {Object.entries(question.options).map(([key, text]) => {
                  const isCorrect = question.answer.includes(key);
                  const isUserAnswer = wa.userAnswer.includes(key);
                  let optionClass = 'option';
                  if (isCorrect) optionClass += ' correct';
                  if (isUserAnswer && !isCorrect) optionClass += ' wrong';

                  return (
                    <div key={key} className={optionClass}>
                      <span className="option-key">{key}</span>
                      <span className="option-text">{String(text)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="answer-compare">
                <span className="correct-answer">正确答案: {question.answer}</span>
                <span className="user-answer">你的答案: {wa.userAnswer}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WrongAnswersPage;
