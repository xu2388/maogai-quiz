const fs = require('fs');

const quizContent = `import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { useStore } from '../store';
import { restoreOriginalAnswer } from '../utils/exam';

export default function QuizPage() {
  const navigate = useNavigate();
  const {
    currentQuestions,
    currentIndex,
    userAnswers,
    mode,
    answerMode,
    examMapping,
    questionBanks,
    currentSubject,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    finishQuiz,
    addWrongAnswer,
    removeWrongAnswer,
  } = useStore();
  const questionBank = questionBanks[currentSubject];

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化
  useEffect(() => {
    if (currentQuestions.length === 0) {
      navigate('/');
    }
  }, [currentQuestions, navigate]);

  // 切换题目时更新选中状态
  useEffect(() => {
    const current = currentQuestions[currentIndex];
    if (current) {
      const existing = userAnswers.get(current.id);
      setSelectedOptions(existing ? existing.userAnswer.split('') : []);
    }
  }, [currentIndex, currentQuestions, userAnswers]);

  if (currentQuestions.length === 0) return null;

  const question = currentQuestions[currentIndex];
  if (!question) return null;

  const userAnswer = userAnswers.get(question.id);
  const isAnswered = !!userAnswer;
  const isLast = currentIndex === currentQuestions.length - 1;
  const isFirst = currentIndex === 0;
  // 练习模式 + 即时显示 → 选完就显示答案
  const showImmediate = mode === 'practice' && answerMode === 'immediate';
  // 是否显示答案面板
  const showAnswerPanel = isAnswered && showImmediate;

  // 获取原始题目（用于错题记录）
  const getOriginalQuestion = () => {
    if (!examMapping || !questionBank) return question;
    const mapping = examMapping.mappings[question.id];
    if (!mapping) return question;
    const originalChapter = questionBank.chapters.find(c => c.index === question.chapterIndex);
    return originalChapter?.questions.find(q => q.id === mapping.originalId) || question;
  };

  // 提交答案核心逻辑
  const submitAnswer = useCallback((answer: string) => {
    if (isAnswered && showImmediate) return;
    const isCorrect = answer === question.answer;
    answerQuestion(question.id, answer, isCorrect);

    if (!isCorrect) {
      const originalQuestion = getOriginalQuestion();
      const originalUserAnswer = examMapping
        ? restoreOriginalAnswer(examMapping, question.id, answer)
        : answer;
      addWrongAnswer({
        questionId: originalQuestion.id,
        chapterIndex: originalQuestion.chapterIndex,
        question: originalQuestion,
        userAnswer: originalUserAnswer,
        wrongCount: 1,
        lastWrongTime: Date.now(),
      });
    } else {
      const originalQuestion = getOriginalQuestion();
      removeWrongAnswer(originalQuestion.id);
    }
  }, [question, isAnswered, showImmediate, answerQuestion, examMapping, addWrongAnswer, removeWrongAnswer]);

  // 选择选项
  const handleSelect = (key: string) => {
    if (isAnswered && showImmediate) return;

    if (question.type === 'single') {
      // 单选题：选中即自动提交
      const answer = key;
      setSelectedOptions([key]);
      submitAnswer(answer);
    } else {
      // 多选题：切换选中状态
      setSelectedOptions(prev =>
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key].sort()
      );
    }
  };

  // 多选题确认提交
  const handleMultiConfirm = () => {
    if (selectedOptions.length === 0) return;
    submitAnswer(selectedOptions.join(''));
  };

  // 滑动导航
  const goNext = useCallback(() => {
    if (isLast) {
      const record = finishQuiz();
      if (record) navigate('/result');
    } else {
      setSlideDirection('left');
      setIsSliding(true);
      setTimeout(() => {
        nextQuestion();
        setIsSliding(false);
        setSlideDirection(null);
      }, 200);
    }
  }, [isLast, finishQuiz, navigate, nextQuestion]);

  const goPrev = useCallback(() => {
    if (isFirst) return;
    setSlideDirection('right');
    setIsSliding(true);
    setTimeout(() => {
      prevQuestion();
      setIsSliding(false);
      setSlideDirection(null);
    }, 200);
  }, [isFirst, prevQuestion]);

  // 触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isSliding) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // 水平滑动距离 > 50 且 > 垂直滑动距离
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        // 左滑 = 下一题（随时可以滑动）
        goNext();
      } else {
        // 右滑 = 上一题
        goPrev();
      }
    }
  };

  // 作答统计
  const answeredCount = currentQuestions.filter(q => userAnswers.has(q.id)).length;
  const progress = ((answeredCount) / currentQuestions.length) * 100;

  // 获取滑出动画类名
  const getSlideClass = () => {
    if (!isSliding) return '';
    return slideDirection === 'left' ? 'slide-out-left' : 'slide-out-right';
  };

  return (
    <div
      className="quiz-container fade-in"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 顶部栏：进度 + 序号 */}
      <div className="quiz-topbar">
        <button className="quiz-back-btn" onClick={() => {
          if (answeredCount > 0 && !confirm('确定要退出吗？已作答的题目会保留。')) return;
          navigate(-1);
        }}>
          <X size={20} />
        </button>

        <div className="quiz-progress-wrap">
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="quiz-progress-info">
            <span className="quiz-progress-num">{answeredCount}/{currentQuestions.length}</span>
            <span className={`quiz-mode-tag ${mode}`}>
              {mode === 'exam' ? '考试' : '练习'}
            </span>
          </div>
        </div>

        <div className="quiz-dots">
          {currentQuestions.map((_, i) => {
            const answered = userAnswers.has(currentQuestions[i].id);
            const correct = userAnswers.get(currentQuestions[i].id)?.isCorrect;
            let cls = 'quiz-dot';
            if (i === currentIndex) cls += ' active';
            else if (answered) cls += correct ? ' done-correct' : ' done-wrong';
            return <span key={i} className={cls} />;
          })}
        </div>
      </div>

      {/* 题目卡片区域 */}
      <div className="quiz-card-area">
        <div className={`quiz-card ${getSlideClass()}`}>
          {/* 题号 & 类型 */}
          <div className="quiz-card-header">
            <span className="quiz-number">第 {currentIndex + 1} 题</span>
            <span className={`quiz-type-tag ${question.type}`}>
              {question.type === 'single' ? '单选' : '多选'}
            </span>
            {question.type === 'multiple' && (
              <span style={{ fontSize: 11, color: '#aeaeb2', marginLeft: 4 }}>
                (可选多个)
              </span>
            )}
          </div>

          {/* 题干 */}
          <div className="quiz-question">{question.question}</div>

          {/* 选项 */}
          <div className="quiz-options">
            {Object.entries(question.options).map(([key, text]) => {
              const isSelected = selectedOptions.includes(key);
              const isCorrectOpt = question.answer.includes(key);
              const isWrongSelect = showAnswerPanel && isSelected && !isCorrectOpt;

              let cls = 'quiz-option';
              if (showAnswerPanel) {
                if (isCorrectOpt) cls += ' correct';
                else if (isWrongSelect) cls += ' wrong';
              } else if (isSelected) {
                cls += ' selected';
              }

              return (
                <button
                  key={key}
                  className={cls}
                  onClick={() => handleSelect(key)}
                  disabled={isAnswered && showImmediate}
                >
                  <span className="quiz-option-key">{key}</span>
                  <span className="quiz-option-text">{text}</span>
                  {showAnswerPanel && isCorrectOpt && <Check size={18} color="#34c759" />}
                  {showAnswerPanel && isWrongSelect && <X size={18} color="#ff3b30" />}
                </button>
              );
            })}
          </div>

          {/* 答案反馈 */}
          {showAnswerPanel && (
            <div className={`quiz-feedback ${userAnswer?.isCorrect ? 'correct' : 'wrong'}`}>
              <div className="quiz-feedback-icon">
                {userAnswer?.isCorrect ? (
                  <Check size={20} />
                ) : (
                  <X size={20} />
                )}
              </div>
              <div className="quiz-feedback-text">
                {userAnswer?.isCorrect ? '回答正确！' : (
                  <>
                    回答错误，正确答案是 <strong>{question.answer}</strong>
                    {userAnswer && <span>（你选了 {userAnswer.userAnswer}）</span>}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 多选题确认按钮 */}
          {question.type === 'multiple' && !isAnswered && selectedOptions.length > 0 && (
            <button className="quiz-multi-confirm" onClick={handleMultiConfirm}>
              确认选择 ({selectedOptions.length} 项)
            </button>
          )}
        </div>
      </div>

      {/* 底部导航 */}
      <div className="quiz-bottom-bar">
        <button
          className="quiz-nav-btn"
          onClick={goPrev}
          disabled={isFirst}
        >
          <ChevronLeft size={20} /> 上一题
        </button>

        <div className="quiz-nav-hint">
          <span className="quiz-nav-arrow">←</span>
          左右滑动切换
          <span className="quiz-nav-arrow">→</span>
        </div>

        {isLast && isAnswered ? (
          <button className="quiz-nav-btn primary" onClick={goNext}>
            查看结果 <ChevronRight size={20} />
          </button>
        ) : (
          <button className="quiz-nav-btn" onClick={goNext}>
            {isLast ? '查看结果' : '下一题'} <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/QuizPage.tsx', quizContent, 'utf8');
console.log('QuizPage.tsx 修复完成');