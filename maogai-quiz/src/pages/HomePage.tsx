import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, AlertCircle, TrendingUp, ChevronRight, GraduationCap } from 'lucide-react';
import { useStore } from '../store';

export default function HomePage() {
  const navigate = useNavigate();
  const { questionBank, wrongAnswers, records } = useStore();

  if (!questionBank) return null;

  const totalAnswered = records.length;
  const avgScore = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length)
    : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">毛概刷题</h1>
        <p className="page-subtitle">毛泽东思想和中国特色社会主义理论体系概论 · 期末复习</p>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f0fe', color: '#0071e3' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <h3>{questionBank.totalQuestions}</h3>
            <p>总题数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f9ed', color: '#34c759' }}>
            <Target size={24} />
          </div>
          <div className="stat-info">
            <h3>{questionBank.totalChapters}</h3>
            <p>章节数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffeef0', color: '#ff3b30' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{wrongAnswers.length}</h3>
            <p>错题数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff4e6', color: '#ff9500' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>{avgScore}</h3>
            <p>平均分</p>
          </div>
        </div>
      </div>

      {/* 考试模式入口 */}
      <div className="card" style={{ marginBottom: 24, cursor: 'pointer' }} onClick={() => navigate('/exam')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ff3b30, #ff6b6b)', color: 'white' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>考试模式</h3>
              <p style={{ fontSize: 13, color: '#6e6e73', marginTop: 2 }}>随机抽题，模拟真实考试</p>
            </div>
          </div>
          <ChevronRight size={20} color="#aeaeb2" />
        </div>
      </div>

      {/* 章节列表 */}
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>章节练习</h2>
      <div className="chapter-list">
        {questionBank.chapters.map(ch => {
          const singleCount = ch.questions.filter(q => q.type === 'single').length;
          const multipleCount = ch.questions.filter(q => q.type === 'multiple').length;
          return (
            <div key={ch.index} className="chapter-card" onClick={() => navigate(`/chapter/${ch.index}`)}>
              <div className="chapter-info">
                <div className="chapter-name">{ch.title}</div>
                <div className="chapter-meta">
                  <span>共 {ch.questions.length} 题</span>
                  <span>单选 {singleCount}</span>
                  <span>多选 {multipleCount}</span>
                </div>
              </div>
              <ChevronRight size={20} color="#aeaeb2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
