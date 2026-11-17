import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import './ExamPage.css';

const ExamPage = () => {
  const navigate = useNavigate();
  const questionBank = useStore((s) => s.questionBank);
  const setCurrentQuestions = useStore((s) => s.setCurrentQuestions);
  const setMode = useStore((s) => s.setMode);
  const setCurrentChapter = useStore((s) => s.setCurrentChapter);
  const setAnswerMode = useStore((s) => s.setAnswerMode);
  const [questionCount, setQuestionCount] = useState(20);

  if (!questionBank) return null;

  // 获取所有题目
  const allQuestions = questionBank.chapters.flatMap(c => c.questions);

  const handleStartExam = () => {
    // 随机抽取题目
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, allQuestions.length));

    setMode('exam');
    setAnswerMode('delayed'); // 考试模式强制延后显示
    setCurrentChapter(null);
    setCurrentQuestions(selected);
    navigate('/quiz');
  };

  const countOptions = [10, 20, 30, 50, allQuestions.length];

  return (
    <div className="exam-page">
      <h1 className="exam-title">考试模式</h1>
      <p className="exam-subtitle">从全部 {allQuestions.length} 道题中随机抽取</p>

      <div className="exam-settings">
        <div className="setting-card">
          <h3 className="setting-card-title">
            <Settings size={18} />
            考试设置
          </h3>

          <div className="setting-row">
            <label className="setting-row-label">题目数量（共 {allQuestions.length} 题可选）</label>
            <div className="count-options">
              {countOptions.map(count => (
                <button
                  key={count}
                  className={questionCount === count ? 'active' : ''}
                  onClick={() => setQuestionCount(count)}
                >
                  {count === allQuestions.length ? '全部' : `${count}题`}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-info">
            <p className="setting-info-title">考试模式说明：</p>
            <ul className="setting-info-list">
              <li>从所有章节的题目中随机抽取</li>
              <li>答完所有题目后显示成绩</li>
              <li>错题会自动加入错题本</li>
            </ul>
          </div>
        </div>
      </div>

      <button className="start-exam-btn" onClick={handleStartExam}>
        <Play size={20} />
        开始考试
      </button>
    </div>
  );
};

export default ExamPage;
