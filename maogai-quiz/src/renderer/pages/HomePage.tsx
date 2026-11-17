import { Link } from 'react-router-dom';
import { BookOpen, Target, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import './HomePage.css';

const HomePage = () => {
  const questionBank = useStore((s) => s.questionBank);
  const wrongAnswers = useStore((s) => s.wrongAnswers);
  const practiceRecords = useStore((s) => s.practiceRecords);

  if (!questionBank) return null;

  const totalQuestions = questionBank.totalQuestions;
  const totalChapters = questionBank.totalChapters;
  const wrongCount = wrongAnswers.length;
  const recordCount = practiceRecords.length;

  // 计算平均分数
  const avgScore = recordCount > 0
    ? Math.round(practiceRecords.reduce((sum, r) => sum + r.score, 0) / recordCount)
    : 0;

  return (
    <div className="home-page">
      {/* 欢迎区域 */}
      <div className="welcome-section">
        <h1 className="welcome-title">欢迎使用毛概刷题</h1>
        <p className="welcome-subtitle">
          共 {totalChapters} 个章节，{totalQuestions} 道题目
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 122, 255, 0.1)', color: '#007aff' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalQuestions}</div>
            <div className="stat-label">总题目数</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{wrongCount}</div>
            <div className="stat-label">错题数</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52, 199, 89, 0.1)', color: '#34c759' }}>
            <Target size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{recordCount}</div>
            <div className="stat-label">练习次数</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(88, 86, 214, 0.1)', color: '#5856d6' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{avgScore}</div>
            <div className="stat-label">平均分数</div>
          </div>
        </div>
      </div>

      {/* 章节列表 */}
      <div className="chapters-section">
        <h2 className="section-title">选择章节练习</h2>
        <div className="chapters-grid">
          {questionBank.chapters.map((chapter) => {
            const singleCount = chapter.questions.filter(q => q.type === 'single').length;
            const multipleCount = chapter.questions.filter(q => q.type === 'multiple').length;
            return (
              <Link
                key={chapter.index}
                to={`/chapter/${chapter.index}`}
                className="chapter-card"
              >
                <div className="chapter-header">
                  <span className="chapter-number">第{chapter.index + 1}章</span>
                  <ChevronRight size={18} className="chapter-arrow" />
                </div>
                <h3 className="chapter-title">{chapter.title}</h3>
                <div className="chapter-meta">
                  <span>{chapter.questions.length} 题</span>
                  <span className="dot">·</span>
                  <span>单选 {singleCount}</span>
                  <span className="dot">·</span>
                  <span>多选 {multipleCount}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
