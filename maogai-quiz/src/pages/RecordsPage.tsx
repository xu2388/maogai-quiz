import { History, Clock, Target, Award } from 'lucide-react';
import { useStore } from '../store';

export default function RecordsPage() {
  const { records } = useStore();

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (ms: number) => {
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}秒`;
    return `${Math.floor(sec / 60)}分${sec % 60}秒`;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">练习记录</h1>
        <p className="page-subtitle">共 {records.length} 次练习记录</p>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <History size={64} />
          </div>
          <div className="empty-state-text">暂无练习记录，开始你的第一次练习吧！</div>
        </div>
      ) : (
        <>
          {/* 统计 */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e8f0fe', color: '#0071e3' }}>
                <Target size={24} />
              </div>
              <div className="stat-info">
                <h3>{records.length}</h3>
                <p>练习次数</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e8f9ed', color: '#34c759' }}>
                <Award size={24} />
              </div>
              <div className="stat-info">
                <h3>
                  {records.length > 0
                    ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length)
                    : 0}
                </h3>
                <p>平均分</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fff4e6', color: '#ff9500' }}>
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>
                  {records.length > 0
                    ? Math.round(records.reduce((s, r) => s + (r.endTime - r.startTime) / 1000, 0) / records.length)
                    : 0}s
                </h3>
                <p>平均用时</p>
              </div>
            </div>
          </div>

          {/* 记录列表 */}
          <div className="record-list">
            {records.map(r => {
              const scoreClass = r.score >= 90 ? '#34c759' : r.score >= 75 ? '#0071e3' : r.score >= 60 ? '#ff9500' : '#ff3b30';
              return (
                <div key={r.id} className="record-item">
                  <div className="record-info">
                    <div className="record-title">{r.chapterTitle}</div>
                    <div className="record-meta">
                      <span>{formatDate(r.startTime)}</span>
                      <span>用时 {formatDuration(r.endTime - r.startTime)}</span>
                      <span>{r.questionCount} 题</span>
                      <span>对 {r.correctCount} · 错 {r.wrongCount}</span>
                      <span className={`mode-badge ${r.mode}`}>
                        {r.mode === 'exam' ? '考试' : '练习'}
                      </span>
                    </div>
                  </div>
                  <div className="record-score">
                    <div className="record-score-value" style={{ color: scoreClass }}>{r.score}</div>
                    <div className="record-score-label">分</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
