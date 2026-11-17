import { Clock, Target, Award, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import './RecordsPage.css';

const RecordsPage = () => {
  const { practiceRecords } = useStore();

  if (practiceRecords.length === 0) {
    return (
      <div className="empty-page">
        <Award size={64} className="empty-icon" />
        <h2>暂无练习记录</h2>
        <p>完成练习后，记录会显示在这里</p>
      </div>
    );
  }

  const sortedRecords = [...practiceRecords].sort((a, b) => b.endTime - a.endTime);

  return (
    <div className="records-page">
      <div className="page-header">
        <h1>练习记录</h1>
        <p>共 {practiceRecords.length} 次练习</p>
      </div>

      <div className="records-list">
        {sortedRecords.map((record) => (
          <div key={record.id} className="record-card">
            <div className="record-header">
              <div className="record-title">
                <span className={`mode-badge ${record.mode}`}>
                  {record.mode === 'practice' ? '练习' : '考试'}
                </span>
                <span className="chapter-name">{record.chapterTitle}</span>
              </div>
              <div className="record-score" style={{ color: record.score >= 60 ? '#34c759' : '#ff3b30' }}>
                {record.score}分
              </div>
            </div>

            <div className="record-stats">
              <div className="record-stat">
                <Target size={14} />
                <span>{record.correctCount}/{record.questionCount} 正确</span>
              </div>
              <div className="record-stat">
                <Clock size={14} />
                <span>{Math.round((record.endTime - record.startTime) / 1000 / 60)} 分钟</span>
              </div>
              <div className="record-stat">
                <Calendar size={14} />
                <span>{new Date(record.endTime).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordsPage;
