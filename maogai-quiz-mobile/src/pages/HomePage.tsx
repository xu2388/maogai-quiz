import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, AlertCircle, TrendingUp, ChevronRight, GraduationCap } from 'lucide-react';
import { useStore } from '../store';
import { SUBJECTS, type SubjectKey } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const { questionBanks, currentSubject, wrongAnswers, records, setSubject } = useStore();

  const questionBank = questionBanks[currentSubject];
  if (!questionBank) return null;

  const avgScore = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length)
    : 0;

  const subjectMeta = SUBJECTS[currentSubject];

  const handleSubjectChange = (key: SubjectKey) => {
    if (key !== currentSubject) setSubject(key);
  };

  return (
    <div className="fade-in">
      {/* 学科选择器 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {(Object.keys(SUBJECTS) as SubjectKey[]).map((key) => {
          const meta = SUBJECTS[key];
          const bank = questionBanks[key];
          const total = bank?.totalQuestions || 0;
          const isActive = key === currentSubject;
          return (
            <div
              key={key}
              onClick={() => handleSubjectChange(key)}
              style={{
                flex: 1,
                padding: '14px 12px',
                borderRadius: 14,
                background: isActive
                  ? `linear-gradient(135deg, ${meta.color}, ${key === 'maogai' ? '#00c6ff' : '#ff6b6b'})`
                  : '#f5f5f7',
                color: isActive ? 'white' : '#333',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'transform 0.15s, box-shadow 0.15s',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive ? `0 4px 16px ${meta.color}33` : 'none',
              }}
            >
              <div style={{
                fontSize: 20, fontWeight: 700, marginBottom: 2,
              }}>{meta.shortName}</div>
              <div style={{
                fontSize: 11, opacity: isActive ? 0.9 : 0.7,
              }}>{total}题</div>
            </div>
          );
        })}
      </div>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36,
            background: `linear-gradient(135deg, ${subjectMeta.color}, ${currentSubject === 'maogai' ? '#00c6ff' : '#ff6b6b'})`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 16,
          }}>{subjectMeta.shortName}</div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{subjectMeta.name}刷题</h1>
        </div>
        <p className="page-subtitle">{subjectMeta.subtitle}</p>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f0fe', color: '#0071e3' }}>
            <BookOpen size={20} />
          </div>
          <div className="stat-info">
            <h3>{questionBank.totalQuestions}</h3>
            <p>总题数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f9ed', color: '#34c759' }}>
            <Target size={20} />
          </div>
          <div className="stat-info">
            <h3>{questionBank.totalChapters}</h3>
            <p>章节数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffeef0', color: '#ff3b30' }}>
            <AlertCircle size={20} />
          </div>
          <div className="stat-info">
            <h3>{wrongAnswers.length}</h3>
            <p>错题数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff4e6', color: '#ff9500' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <h3>{avgScore}</h3>
            <p>平均分</p>
          </div>
        </div>
      </div>

      {/* 考试模式入口 */}
      <div className="card" style={{ marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate('/exam')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44,
              background: `linear-gradient(135deg, ${subjectMeta.color}, ${currentSubject === 'maogai' ? '#00c6ff' : '#ff6b6b'})`,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
            }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>考试模式</h3>
              <p style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>随机抽题，选项乱序，模拟真实考试</p>
            </div>
          </div>
          <ChevronRight size={20} color="#aeaeb2" />
        </div>
      </div>

      {/* 章节列表 */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>章节练习</h2>
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
              <ChevronRight size={18} color="#aeaeb2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}