import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, GraduationCap } from 'lucide-react';
import { useStore } from '../store';
import { generateExam, sampleQuestionsByChapter } from '../utils/exam';
import { saveExamMapping } from '../api';

type ExamPattern = 'fixed-40-20' | 'custom' | 'all';

export default function ExamPage() {
  const navigate = useNavigate();
  const { questionBanks, currentSubject, startQuiz } = useStore();
  const questionBank = questionBanks[currentSubject];
  const [pattern, setPattern] = useState<ExamPattern>('fixed-40-20');
  const [count, setCount] = useState(20);

  if (!questionBank) return null;

  const allQuestions = questionBank.chapters.flatMap(c => c.questions);
  const singleQuestions = allQuestions.filter(q => q.type === 'single');
  const multipleQuestions = allQuestions.filter(q => q.type === 'multiple');
  const totalCount = allQuestions.length;

  const fixedPatternAvailable = singleQuestions.length >= 40 && multipleQuestions.length >= 20;

  const handleStart = () => {
    if (!questionBank) return;

    let questions: typeof questionBank.chapters[0]['questions'] = [];
    let mapping: ReturnType<typeof generateExam>['mapping'] | undefined;
    let title = '';

    if (pattern === 'fixed-40-20') {
      const result = generateExam(questionBank, '40单选+20多选', 40, 20);
      questions = result.questions;
      mapping = result.mapping;
      title = '考试模式（40单选+20多选）';
    } else if (pattern === 'all') {
      const singleAll = sampleQuestionsByChapter(questionBank, 'single', singleQuestions.length);
      const multipleAll = sampleQuestionsByChapter(questionBank, 'multiple', multipleQuestions.length);
      const result = generateExam(questionBank, `全部题目（${totalCount}题）`, singleAll.length, multipleAll.length);
      questions = result.questions;
      mapping = result.mapping;
      title = `考试模式（全部 ${totalCount} 题）`;
    } else {
      const actualCount = Math.min(count, totalCount);
      const singleRatio = singleQuestions.length / totalCount;
      const singleCountForExam = Math.min(
        Math.max(1, Math.round(actualCount * singleRatio)),
        singleQuestions.length,
      );
      const multipleCountForExam = Math.min(actualCount - singleCountForExam, multipleQuestions.length);
      const result = generateExam(questionBank, `自定义${actualCount}题`, singleCountForExam, multipleCountForExam);
      questions = result.questions;
      mapping = result.mapping;
      title = `考试模式（${questions.length}题随机）`;
    }

    if (mapping) saveExamMapping(mapping);
    startQuiz(questions, 'exam', 'delayed', title, mapping);
    navigate('/quiz');
  };

  const examDescription = useMemo(() => {
    if (pattern === 'fixed-40-20') {
      return [
        '40 道单选题 + 20 道多选题',
        '题目按章节分层均匀采样',
        '选项顺序随机打乱，防止背诵',
        '全部答完后统一评分',
        '错题自动加入错题本',
      ];
    }
    if (pattern === 'all') {
      return [
        `从全部 ${totalCount} 道题目中抽取`,
        '题目按章节分层均匀采样',
        '选项顺序随机打乱，防止背诵',
        '全部答完后统一评分',
        '错题自动加入错题本',
      ];
    }
    return [
      `从全部 ${totalCount} 道题目中随机抽取`,
      '题目按章节分层均匀采样',
      '选项顺序随机打乱，防止背诵',
      '全部答完后统一评分',
      '错题自动加入错题本',
    ];
  }, [pattern, totalCount]);

  const countOptions = [10, 20, 30, 50, 100];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">考试模式</h1>
        <p className="page-subtitle">模拟真实考试，选项乱序防作弊</p>
      </div>

      <div className="settings-section">
        <div className="settings-title">考试设置</div>

        <div className="setting-row">
          <div className="setting-label">
            <GraduationCap size={15} style={{ display: 'inline', marginRight: 4 }} />
            出题模式
          </div>
          <div className="option-group">
            <button
              className={`option-btn ${pattern === 'fixed-40-20' ? 'active' : ''}`}
              onClick={() => setPattern('fixed-40-20')}
              disabled={!fixedPatternAvailable}
            >
              40单选+20多选
            </button>
            <button
              className={`option-btn ${pattern === 'custom' ? 'active' : ''}`}
              onClick={() => setPattern('custom')}
            >
              自定义
            </button>
            <button
              className={`option-btn ${pattern === 'all' ? 'active' : ''}`}
              onClick={() => setPattern('all')}
            >
              全部
            </button>
          </div>
          {!fixedPatternAvailable && (
            <p style={{ fontSize: 12, color: '#ff3b30', marginTop: 6 }}>
              题库中单选 {singleQuestions.length} 道、多选 {multipleQuestions.length} 道，不足以支持 40+20 模式。
            </p>
          )}
        </div>

        {pattern === 'custom' && (
          <div className="setting-row">
            <div className="setting-label">题目数量（共 {totalCount} 题可选）</div>
            <div className="option-group">
              {countOptions.map(c => (
                <button
                  key={c}
                  className={`option-btn ${count === c ? 'active' : ''}`}
                  onClick={() => setCount(c)}
                >
                  {c} 题
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="setting-row">
          <div className="setting-label">考试说明</div>
          <div style={{ fontSize: 13, color: '#6e6e73', lineHeight: 1.7, background: '#fafafa', padding: 12, borderRadius: 10 }}>
            {examDescription.map((line, i) => (
              <p key={i}>- {line}</p>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={handleStart}>
          <Play size={16} /> 开始考试
        </button>
      </div>
    </div>
  );
}