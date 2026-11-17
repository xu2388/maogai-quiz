import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RotateCcw, Home, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import './ResultPage.css';

const ResultPage = () => {
  const navigate = useNavigate();
  const userAnswers = useStore((s) => s.userAnswers);
  const currentQuestions = useStore((s) => s.currentQuestions);
  const resetQuiz = useStore((s) => s.resetQuiz);

  if (currentQuestions.length === 0) {
    return (
      <div className="result-page-empty">
        <p>暂无答题记录</p>
        <button className="action-btn secondary" onClick={() => navigate('/')}>
          <Home size={18} />
          返回首页
        </button>
      </div>
    );
  }

  const answers = Array.from(userAnswers.values());
  const correctCount = answers.filter(a => a.isCorrect).length;
  const wrongCount = answers.length - correctCount;
  const score = Math.round((correctCount / currentQuestions.length) * 100);

  // 分数圆圈显示（不同分数不同颜色：>=90绿 >=80蓝 >=60橙 <60红）
  const getScoreLevel = () => {
    if (score >= 90) return { text: '优秀', color: '#34c759' };
    if (score >= 80) return { text: '良好', color: '#007aff' };
    if (score >= 60) return { text: '及格', color: '#ff9500' };
    return { text: '不及格', color: '#ff3b30' };
  };

  const level = getScoreLevel();

  const handleRestart = () => {
    resetQuiz();
    navigate('/');
  };

  return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-header">
          <Trophy size={48} style={{ color: level.color }} />
          <h1 className="result-title">练习完成</h1>
        </div>

        {/* 分数圆圈显示 */}
        <div className="score-section">
          <div className="score-circle" style={{ borderColor: level.color }}>
            <span className="score-number" style={{ color: level.color }}>{score}</span>
            <span className="score-label">分</span>
          </div>
          <div className="score-level" style={{ color: level.color }}>{level.text}</div>
        </div>

        {/* 统计：正确数、错误数、总题数 */}
        <div className="stats-row">
          <div className="stat-item">
            <CheckCircle size={20} className="correct-icon" />
            <span>正确 {correctCount}</span>
          </div>
          <div className="stat-item">
            <XCircle size={20} className="wrong-icon" />
            <span>错误 {wrongCount}</span>
          </div>
          <div className="stat-item">
            <span>共 {currentQuestions.length} 题</span>
          </div>
        </div>

        <div className="result-actions">
          <button className="action-btn primary" onClick={handleRestart}>
            <RotateCcw size={18} />
            再来一次
          </button>
          <button className="action-btn secondary" onClick={() => navigate('/')}>
            <Home size={18} />
            返回首页
          </button>
        </div>
      </div>

      {/* 答题回顾列表 */}
      <div className="answers-review">
        <h2 className="review-title">答题回顾</h2>
        <div className="answers-list">
          {currentQuestions.map((q, i) => {
            const answer = userAnswers.get(q.id);
            const isCorrect = answer?.isCorrect;

            return (
              <div key={q.id} className={`review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                <div className="review-header">
                  <span className="review-number">{i + 1}</span>
                  {isCorrect ? <CheckCircle size={16} className="correct-icon" /> : <XCircle size={16} className="wrong-icon" />}
                </div>
                <div className="review-content">
                  <p className="review-question">{q.question}</p>
                  <div className="review-answers">
                    <span className="review-correct-answer">正确答案: {q.answer}</span>
                    <span className="review-user-answer">你的答案: {answer?.userAnswer || '未作答'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
