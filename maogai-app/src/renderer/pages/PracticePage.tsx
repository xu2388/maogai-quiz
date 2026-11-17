import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { unescapeQuestion } from '../utils/textUtils';
import './PracticePage.css';

const PracticePage = () => {
  const navigate = useNavigate();
  const {
    currentQuestions,
    currentQuestionIndex,
    userAnswers,
    mode,
    answerMode,
    setCurrentQuestionIndex,
    answerQuestion,
    finishQuiz,
    addWrongAnswer,
    removeWrongAnswer,
    startQuiz,
  } = useStore();

  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (currentQuestions.length === 0) {
      navigate('/');
      return;
    }
    startQuiz();
  }, [currentQuestions, navigate, startQuiz]);

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const userAnswer = userAnswers.get(currentQuestion?.id);
  const isAnswered = !!userAnswer;
  const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;

  // 是否即时显示答案：练习模式的即时模式
  const isImmediateMode = mode === 'practice' && answerMode === 'immediate';

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;

    if (currentQuestion.type === 'single') {
      setSelectedOptions([option]);
    } else {
      setSelectedOptions(prev =>
        prev.includes(option)
          ? prev.filter(o => o !== option)
          : [...prev, option].sort()
      );
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) return;

    const answer = selectedOptions.join('');
    const isCorrect = answer === currentQuestion.answer;

    answerQuestion(currentQuestion.id, answer, isCorrect);

    if (!isCorrect) {
      addWrongAnswer({
        questionId: currentQuestion.id,
        question: currentQuestion,
        userAnswer: answer,
        wrongCount: 1,
        lastWrongTime: Date.now(),
      });
    } else {
      removeWrongAnswer(currentQuestion.id);
    }

    if (isImmediateMode) {
      // 即时模式：显示答案
      setShowAnswer(true);
    } else {
      // 延后模式/考试模式：不显示答案，直接进入下一题
      goToNext();
    }
  };

  const goToNext = () => {
    if (isLastQuestion) {
      finishQuiz().then(() => {
        navigate('/result');
      });
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setSelectedOptions([]);
    }
  };

  const handleNext = () => {
    goToNext();
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevAnswer = userAnswers.get(currentQuestions[currentQuestionIndex - 1].id);
      setSelectedOptions(prevAnswer ? prevAnswer.userAnswer.split('') : []);
      // 即时模式下，已答过的题显示答案
      setShowAnswer(isImmediateMode && !!prevAnswer);
    }
  };

  // 处理转义字符
  const displayQuestion = useMemo(() => {
    if (!currentQuestion) return null;
    return unescapeQuestion(currentQuestion);
  }, [currentQuestion]);

  if (!displayQuestion) return null;

  // 是否显示答题结果
  const showResult = showAnswer || (isImmediateMode && isAnswered);

  return (
    <div className="practice-page">
      {/* 进度条 */}
      <div className="progress-bar">
        <div className="progress-info">
          <span>题目 {currentQuestionIndex + 1} / {currentQuestions.length}</span>
          <span>{Math.round(((currentQuestionIndex + 1) / currentQuestions.length) * 100)}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 模式提示 */}
      <div className="mode-hint">
        {mode === 'exam' ? '考试模式' : answerMode === 'immediate' ? '即时练习' : '延后练习'}
        {!isImmediateMode && !isAnswered && ' · 答完后进入下一题'}
      </div>

      {/* 题目卡片 */}
      <div className="question-card">
        <div className="question-header">
          <span className={`question-type ${currentQuestion.type}`}>
            {currentQuestion.type === 'single' ? '单选题' : '多选题'}
          </span>
          <span className="question-number">第 {currentQuestion.number} 题</span>
        </div>

        <h2 className="question-text">{displayQuestion.question}</h2>

        <div className="options-list">
          {Object.entries(displayQuestion.options).map(([key, text]) => {
            const isSelected = selectedOptions.includes(key);
            const isCorrect = displayQuestion.answer.includes(key);

            let optionClass = 'option';
            if (showResult) {
              if (isCorrect) optionClass += ' correct';
              else if (isSelected) optionClass += ' wrong';
            } else if (isSelected) {
              optionClass += ' selected';
            }

            return (
              <button
                key={key}
                className={optionClass}
                onClick={() => handleOptionSelect(key)}
                disabled={isAnswered}
              >
                <span className="option-key">{key}</span>
                <span className="option-text">{String(text)}</span>
                {showResult && isCorrect && <Check size={20} className="option-icon" />}
                {showResult && isSelected && !isCorrect && <X size={20} className="option-icon" />}
              </button>
            );
          })}
        </div>

        {/* 答案解析 - 仅即时模式显示 */}
        {showResult && (
          <div className="answer-section">
            <div className={`answer-result ${userAnswer?.isCorrect ? 'correct' : 'wrong'}`}>
              {userAnswer?.isCorrect ? (
                <><Check size={20} /> 回答正确</>
              ) : (
                <><X size={20} /> 回答错误</>
              )}
            </div>
            <div className="answer-detail">
              <p><strong>正确答案：</strong>{displayQuestion.answer}</p>
              <p><strong>你的答案：</strong>{userAnswer?.userAnswer || '未作答'}</p>
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="practice-footer">
        <button
          className="footer-btn secondary"
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft size={18} />
          上一题
        </button>

        {!isAnswered ? (
          <button
            className="footer-btn primary"
            onClick={handleSubmit}
            disabled={selectedOptions.length === 0}
          >
            {isImmediateMode ? '提交答案' : (isLastQuestion ? '提交并查看结果' : '提交并下一题')}
          </button>
        ) : (
          <button className="footer-btn primary" onClick={handleNext}>
            {isLastQuestion ? '查看结果' : '下一题'}
            {!isLastQuestion && <ArrowRight size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default PracticePage;
