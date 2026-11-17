import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Shuffle, GraduationCap } from 'lucide-react';
import { useStore } from '../store';
import { generateExam, sampleQuestionsByChapter, shuffleArray } from '../utils/exam';

type ExamPattern = 'fixed-40-20' | 'custom' | 'all';

export default function ExamPage() {
  const navigate = useNavigate();
  const { questionBank, startQuiz } = useStore();
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

    if (pattern === 'fixed-40-20') {
      // 分层均匀采样：40 单选 + 20 多选，每章尽量平分
      const { questions, mapping } = generateExam(questionBank, '40单选+20多选', 40, 20);
      // 保存映射文件到本地
      window.electronAPI.saveExamMapping(mapping).catch(console.error);
      startQuiz(questions, 'exam', 'delayed', '考试模式（40单选+20多选）', mapping);
    } else if (pattern === 'all') {
      // 全部题目：分层均匀抽取所有单选和多选
      const singleAll = sampleQuestionsByChapter(questionBank, 'single', singleQuestions.length);
      const multipleAll = sampleQuestionsByChapter(questionBank, 'multiple', multipleQuestions.length);
      const { questions, mapping } = generateExam(
        questionBank,
        `全部题目（${totalCount}题）`,
        singleAll.length,
        multipleAll.length
      );
      window.electronAPI.saveExamMapping(mapping).catch(console.error);
      startQuiz(questions, 'exam', 'delayed', `考试模式（全部 ${totalCount} 题）`, mapping);
    } else {
      // 自定义数量：按题目类型比例分层采样
      const actualCount = Math.min(count, totalCount);
      const singleRatio = singleQuestions.length / totalCount;
      const singleCount = Math.min(
        Math.max(1, Math.round(actualCount * singleRatio)),
        singleQuestions.length
      );
      const multipleCount = Math.min(actualCount - singleCount, multipleQuestions.length);
      const { questions, mapping } = generateExam(
        questionBank,
        `自定义${actualCount}题`,
        singleCount,
        multipleCount
      );
      window.electronAPI.saveExamMapping(mapping).catch(console.error);
      startQuiz(questions, 'exam', 'delayed', `考试模式（${questions.length}题随机）`, mapping);
    }

    navigate('/quiz');
  };

  const countOptions = [10, 20, 30, 50, 100];

  const examDescription = useMemo(() => {
    if (pattern === 'fixed-40-20') {
      return [
        '本模式按照真实考试结构出题：40 道单选题 + 20 道多选题',
        '题目按章节分层均匀采样，每章尽量平分',
        '每道题的选项顺序会被随机打乱，防止背诵答案',
        '考试过程中不显示正确答案，全部答完后统一评分',
        '答题完成后将显示得分、正确率和每题详情',
        '错题将自动加入错题本',
      ];
    }
    if (pattern === 'all') {
      return [
        `本模式从全部 ${totalCount} 道题目中抽取所有题目`,
        '题目按章节分层均匀采样',
        '每道题的选项顺序会被随机打乱，防止背诵答案',
        '考试过程中不显示正确答案，全部答完后统一评分',
        '答题完成后将显示得分、正确率和每题详情',
        '错题将自动加入错题本',
      ];
    }
    return [
      `本模式从全部 ${totalCount} 道题目中随机抽取 ${Math.min(count, totalCount)} 道题`,
      '题目按章节分层均匀采样',
      '每道题的选项顺序会被随机打乱，防止背诵答案',
      '考试过程中不显示正确答案，全部答完后统一评分',
      '答题完成后将显示得分、正确率和每题详情',
      '错题将自动加入错题本',
    ];
  }, [pattern, count, totalCount]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">考试模式</h1>
        <p className="page-subtitle">模拟真实考试结构，全面检验复习成果</p>
      </div>

      <div className="settings-section">
        <div className="settings-title">考试设置</div>

        <div className="setting-row">
          <div className="setting-label">
            <GraduationCap size={16} style={{ display: 'inline', marginRight: 6 }} />
            出题模式
          </div>
          <div className="option-group">
            <button
              className={`option-btn ${pattern === 'fixed-40-20' ? 'active' : ''}`}
              onClick={() => setPattern('fixed-40-20')}
              disabled={!fixedPatternAvailable}
              title={fixedPatternAvailable ? '' : '题库中单选或多选数量不足'}
            >
              40单选+20多选
            </button>
            <button
              className={`option-btn ${pattern === 'custom' ? 'active' : ''}`}
              onClick={() => setPattern('custom')}
            >
              自定义数量
            </button>
            <button
              className={`option-btn ${pattern === 'all' ? 'active' : ''}`}
              onClick={() => setPattern('all')}
            >
              全部题目
            </button>
          </div>
          {!fixedPatternAvailable && (
            <p style={{ fontSize: 13, color: '#ff3b30', marginTop: 8 }}>
              题库中单选题为 {singleQuestions.length} 道、多选题为 {multipleQuestions.length} 道，不足以支持 40+20 模式。
            </p>
          )}
        </div>

        {pattern === 'custom' && (
          <div className="setting-row">
            <div className="setting-label">
              <Shuffle size={16} style={{ display: 'inline', marginRight: 6 }} />
              题目数量（共 {totalCount} 题可选）
            </div>
            <div className="option-group">
              {countOptions.map(c => (
                <button
                  key={c}
                  className={`option-btn ${count === c ? 'active' : ''}`}
                  onClick={() => setCount(c)}
                >
                  {`${c} 题`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="setting-row">
          <div className="setting-label">考试说明</div>
          <div style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.8, background: '#fafafa', padding: 16, borderRadius: 12 }}>
            {examDescription.map((line, i) => (
              <p key={i}>• {line}</p>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleStart}>
          <Play size={16} /> 开始考试
        </button>
      </div>
    </div>
  );
}
