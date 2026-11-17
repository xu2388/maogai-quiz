import { Clock, Target, Award, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import './RecordsPage.css';

const RecordsPage = () => {
  const practiceRecords = useStore((s) => s.practiceRecords);

  // 空状态提示
  if (practiceRecords.length === 0) {
    return (
      <div className="empty-page">
        <Award size={64} className="empty-icon" />
        <h2 className="empty-title">暂无练习记录</h2>
        <p className="empty-desc">完成练习后，记录会显示在这里</p>
      </div>
    );
  }

  const sortedRecords = [...practiceRecords].sort((a, b) => b.endTime - a.endTime);

  // 格式化用时
  const formatDuration = (startTime: number, endTime: number) => {
    const seconds = Math.round((endTime - startTime) / 1000);
    if (seconds < 60) return `${seconds} 秒`;
    const minutes = Math.round(seconds / 60);
    return `${minutes} 分钟`;
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="records-page">
      <div className="page-header">
        <h1 className="page-title">练习记录</h1>
        <p className="page-subtitle">共 {practiceRecords.length} 次练习</p>
      </div>

      <div className="records-list">
        {sortedRecords.map((record) => {
          const accuracy = record.questionCount > 0
            ? Math.round((record.correctCount / record.questionCount) * 100)
            : 0;
          const scoreColor = record.score >= 60 ? '#34c759' : '#ff3b30';

          return (
            <div key={record.id} className="record-card">
              <div className="record-header">
                <div className="record-title">
                  <span className={`mode-badge ${record.mode}`}>
                    {record.mode === 'practice' ? '练习' : '考试'}
                  </span>
                  <span className="chapter-name">{record.chapterTitle}</span>
                </div>
                <div className="record-score" style={{ color: scoreColor }}>
                  {record.score}分
                </div>
              </div>

              <div className="record-stats">
                <div className="record-stat">
                  <Target size={14} />
                  <span>正确率 {accuracy}%</span>
                </div>
                <div className="record-stat">
                  <Award size={14} />
                  <span>{record.correctCount}/{record.questionCount} 正确</span>
                </div>
                <div className="record-stat">
                  <Clock size={14} />
                  <span>{formatDuration(record.startTime, record.endTime)}</span>
                </div>
                <div className="record-stat">
                  <Calendar size={14} />
                  <span>{formatDate(record.endTime)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecordsPage;
