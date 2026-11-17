import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Home, RotateCcw, ArrowLeft } from 'lucide-react';
import { useStore } from '../store';
import type { PracticeRecord } from '../types';

export default function ResultPage() {
  const navigate = useNavigate();
  const { currentQuestions, userAnswers, finishQuiz } = useStore();
  const [record, setRecord] = useState<PracticeRecord | null>(null);

  useEffect(() => {
    if (currentQuestions.length === 0) {
      navigate('/');
      return;
    }
    const r = finishQuiz();
    if (r) setRecord(r);
  }, []);

  if (!record) return <div style={{ textAlign: 'center', padding: 40 }}>计算成绩中...</div>;

  const scoreClass = record.score >= 90 ? 'excellent' : record.score >= 75 ? 'good' : record.score >= 60 ? 'pass' : 'fail';
  const scoreLabel = record.score >= 90 ? '优秀' : record.score >= 75 ? '良好' : record.score >= 60 ? '及格' : '不及格';

  return (
    <div className="fade-in" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="score-card">
        <div className={`score-circle ${scoreClass}`}>{record.score}</div>
        <div className="score-label">{scoreLabel}</div>
        <p style={{ color: '#6e6e73', fontSize: 13 }}>{record.chapterTitle}</p>

        <div className="score-stats">
          <div className="score-stat">
            <div className="score-stat-value" style={{ color: '#34c759' }}>{record.correctCount}</div>
            <div className="score-stat-label">答对</div>
          </div>
          <div className="score-stat">
            <div className="score-stat-value" style={{ color: '#ff3b30' }}>{record.wrongCount}</div>
            <div className="score-stat-label">答错</div>
          </div>
          <div className="score-stat">
            <div className="score-stat-value">{record.questionCount}</div>
            <div className="score-stat-label">总题数</div>
          </div>
          <div className="score-stat">
            <div className="score-stat-value">
              {Math.round((record.endTime - record.startTime) / 1000)}s
            </div>
            <div className="score-stat-label">用时</div>
          </div>
        </div>
      </div>

      {/* 题目回顾 */}
      <div className="settings-section">
        <div className="settings-title">题目回顾</div>
        <div className="review-list">
          {currentQuestions.map((q, i) => {
            const ans = userAnswers.get(q.id);
            const isCorrect = ans?.isCorrect;
            return (
              <div key={q.id} className={`review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {isCorrect ? <CheckCircle size={14} color="#34c759" /> : <XCircle size={14} color="#ff3b30" />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6e6e73' }}>第 {i + 1} 题</span>
                  <span className={`question-type-tag ${q.type}`} style={{ fontSize: 10 }}>
                    {q.type === 'single' ? '单选' : '多选'}
                  </span>
                </div>
                <div className="review-question">{q.question}</div>
                <div className="review-answers">
                  <span className="correct-answer">正确: {q.answer}</span>
                  <span className="user-answer">你的: {ans?.userAnswer || '未作答'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          <Home size={16} /> 返回首页
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/exam')}>
          <RotateCcw size={16} /> 再考一次
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/wrong-answers')}>
          <ArrowLeft size={16} /> 查看错题
        </button>
      </div>
    </div>
  );
}