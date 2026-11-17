import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store';
import type { AnswerMode } from '../types';

export default function ChapterPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const { questionBank, startQuiz } = useStore();
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
      <button className="btn btn-secondary" style={{ marginBottom: 20 }} onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> 返回首页
      </button>

      <div className="page-header">
        <h1 className="page-title">{chapter.title}</h1>
        <p className="page-subtitle">共 {chapter.questions.length} 题（单选 {singleCount} 题，多选 {multipleCount} 题）</p>
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Eye size={16} /> 即时显示答案
              </span>
            </button>
            <button
              className={`option-btn ${answerMode === 'delayed' ? 'active' : ''}`}
              onClick={() => setAnswerMode('delayed')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <EyeOff size={16} /> 做完再显示答案
              </span>
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#aeaeb2', marginTop: 8 }}>
            {answerMode === 'immediate'
              ? '每答完一题立即显示正确答案和解析'
              : '全部题目答完后统一查看答案和成绩'}
          </p>
        </div>

        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleStart}>
          <Play size={16} /> 开始练习
        </button>
      </div>

      {/* 题目预览 */}
      <div className="settings-section">
        <div className="settings-title">题目预览</div>
        <div className="chapter-list">
          {chapter.questions.slice(0, 5).map((q, i) => (
            <div key={q.id} className="chapter-card" style={{ cursor: 'default', padding: '14px 20px' }}>
              <div className="chapter-info">
                <div style={{ fontSize: 14, color: '#1d1d1f' }}>
                  <span style={{ color: '#aeaeb2', marginRight: 8 }}>{i + 1}.</span>
                  {q.question.substring(0, 60)}...
                </div>
              </div>
              <span className={`question-type-tag ${q.type}`}>
                {q.type === 'single' ? '单选' : '多选'}
              </span>
            </div>
          ))}
          {chapter.questions.length > 5 && (
            <p style={{ fontSize: 13, color: '#aeaeb2', textAlign: 'center', padding: 8 }}>
              还有 {chapter.questions.length - 5} 道题目...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
