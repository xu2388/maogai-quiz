import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Settings, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { unescapeText } from '../utils/textUtils';
import './ChapterPage.css';

const ChapterPage = () => {
  const { chapterIndex } = useParams<{ chapterIndex: string }>();
  const navigate = useNavigate();
  const { 
    questionBank, 
    setCurrentChapter, 
    setCurrentQuestions, 
    setMode, 
    answerMode, 
    setAnswerMode 
  } = useStore();

  const chapter = questionBank?.chapters.find(c => c.index === parseInt(chapterIndex || '0'));

  useEffect(() => {
    if (chapter) {
      setCurrentChapter(chapter);
    }
  }, [chapter, setCurrentChapter]);

  if (!chapter) {
    return <div>章节不存在</div>;
  }

  const handleStartPractice = () => {
    setMode('practice');
    setCurrentQuestions(chapter.questions);
    navigate('/practice');
  };

  return (
    <div className="chapter-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        返回
      </button>

      <div className="chapter-header-card">
        <h1 className="chapter-page-title">{chapter.title}</h1>
        <div className="chapter-stats">
          <span className="stat-badge">共 {chapter.questions.length} 题</span>
          <span className="stat-badge">
            单选 {chapter.questions.filter(q => q.type === 'single').length}
          </span>
          <span className="stat-badge">
            多选 {chapter.questions.filter(q => q.type === 'multiple').length}
          </span>
        </div>
      </div>

      <div className="practice-settings">
        <h3 className="settings-title">
          <Settings size={18} />
          练习设置
        </h3>
        
        <div className="setting-item">
          <span className="setting-label">答案显示模式</span>
          <div className="setting-options">
            <button
              className={`option-btn ${answerMode === 'immediate' ? 'active' : ''}`}
              onClick={() => setAnswerMode('immediate')}
            >
              <Eye size={16} />
              即时显示
              <small>答完一题立即显示答案</small>
            </button>
            <button
              className={`option-btn ${answerMode === 'delayed' ? 'active' : ''}`}
              onClick={() => setAnswerMode('delayed')}
            >
              <EyeOff size={16} />
              延后显示
              <small>全部答完再显示答案</small>
            </button>
          </div>
        </div>
      </div>

      <button className="start-btn" onClick={handleStartPractice}>
        <Play size={20} />
        开始练习
      </button>

      <div className="question-preview">
        <h3 className="preview-title">题目预览</h3>
        <div className="question-list">
          {chapter.questions.slice(0, 5).map((q, i) => (
            <div key={q.id} className="preview-item">
              <span className="preview-number">{i + 1}</span>
              <span className="preview-type">{q.type === 'single' ? '单选' : '多选'}</span>
              <span className="preview-text">{unescapeText(q.question).substring(0, 50)}...</span>
            </div>
          ))}
          {chapter.questions.length > 5 && (
            <div className="preview-more">
              还有 {chapter.questions.length - 5} 道题...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterPage;
