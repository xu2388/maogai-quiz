import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store';
import type { AnswerMode } from '../types';

export default function ChapterPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const { questionBanks, currentSubject, startQuiz } = useStore();
  const questionBank = questionBanks[currentSubject];
  const [answerMode, setAnswerMode] = useState<AnswerMode>('immediate');

  if (!questionBank) return null;

  const chapterIndex = parseInt(index || '0');
  const chapter = questionBank.chapters[chapterIndex];
  if (!chapter) return <div>章节不存在</div>;

  const handleStart = () => {
    startQuiz(chapter.questions, 'practice', answerMode, chapter.title);
    navigate('/quiz');
  };

  const singleCount = chapter.questions.filter(q => q.type === 'single').length;
  const multipleCount = chapter.questions.filter(q => q.type === 'multiple').length;

  return (
    <div className="fade-in">
      <button className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> 返回
      </button>

      <div className="page-header">
        <h1 className="page-title">{chapter.title}</h1>
        <p className="page-subtitle">共 {chapter.questions.length} 题（单选 {singleCount}，多选 {multipleCount}）</p>
      </div>

      <div className="settings-section">
        <div className="settings-title">练习设置</div>

        <div className="setting-row">
          <div className="setting-label">答题模式</div>
          <div className="option-group">
            <button
              className={`option-btn ${answerMode === 'immediate' ? 'active' : ''}`}
              onClick={() => setAnswerMode('immediate')}
            >
              <Eye size={15} /> 即时显示
            </button>
            <button
              className={`option-btn ${answerMode === 'delayed' ? 'active' : ''}`}
              onClick={() => setAnswerMode('delayed')}
            >
              <EyeOff size={15} /> 做完再看
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#aeaeb2', marginTop: 6 }}>
            {answerMode === 'immediate' ? '答完一题立即显示正确答案' : '全部答完后统一查看答案'}
          </p>
        </div>

        <button className="btn btn-primary btn-block" onClick={handleStart}>
          <Play size={16} /> 开始练习
        </button>
      </div>

      {/* 题目预览 */}
      <div className="settings-section">
        <div className="settings-title">题目预览</div>
        {chapter.questions.slice(0, 5).map((q, i) => (
          <div key={q.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: '1px solid #f0f0f2',
            gap: 8,
          }}>
            <div style={{ fontSize: 13, flex: 1, minWidth: 0 }}>
              <span style={{ color: '#aeaeb2', marginRight: 6 }}>{i + 1}.</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '85%', verticalAlign: 'bottom' }}>
                {q.question.substring(0, 50)}...
              </span>
            </div>
            <span className={`question-type-tag ${q.type}`} style={{ flexShrink: 0 }}>
              {q.type === 'single' ? '单选' : '多选'}
            </span>
          </div>
        ))}
        {chapter.questions.length > 5 && (
          <p style={{ fontSize: 12, color: '#aeaeb2', textAlign: 'center', padding: '8px 0 0' }}>
            还有 {chapter.questions.length - 5} 道题目...
          </p>
        )}
      </div>
    </div>
  );
}