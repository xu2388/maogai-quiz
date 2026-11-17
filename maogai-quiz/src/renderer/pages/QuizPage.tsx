import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import './QuizPage.css';

const QuizPage = () => {
  const navigate = useNavigate();
  const currentQuestions = useStore((s) => s.currentQuestions);
  const currentQuestionIndex = useStore((s) => s.currentQuestionIndex);
  const userAnswers = useStore((s) => s.userAnswers);
  const mode = useStore((s) => s.mode);
  const answerMode = useStore((s) => s.answerMode);
  const setCurrentQuestionIndex = useStore((s) => s.setCurrentQuestionIndex);
  const answerQuestion = useStore((s) => s.answerQuestion);
  const finishQuiz = useStore((s) => s.finishQuiz);
  const addWrongAnswer = useStore((s) => s.addWrongAnswer);
  const removeWrongAnswer = useStore((s) => s.removeWrongAnswer);
  const startQuiz = useStore((s) => s.startQuiz);

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
      // 单选题点击直接选中
      setSelectedOptions([option]);
    } else {
      // 多选题可多选
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
      // 即时模式：显示答案对错
      setShowAnswer(true);
    } else {
      // 延后模式/考试模式：直接进入下一题
      goToNext();
    }
  };

  const goToNext = () => {
    if (isLastQuestion) {
      // 最后一题提交后调用 finishQuiz 并跳转 /result
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

  if (!currentQuestion) return null;

  // 是否显示答题结果（答案区域仅在即时模式且已答题后显示）
  const showResult = showAnswer || (isImmediateMode && isAnswered);

  const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;

  return (
    <div className="quiz-page">
      {/* 进度条 */}
      <div className="progress-bar">
        <div className="progress-info">
          <span>题目 {currentQuestionIndex + 1} / {currentQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 模式提示标签 */}
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

        <h2 className="question-text">{currentQuestion.question}</h2>

        <div className="options-list">
          {Object.entries(currentQuestion.options).map(([key, text]) => {
            const isSelected = selectedOptions.includes(key);
            const isCorrect = currentQuestion.answer.includes(key);

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

        {/* 答案区域 - 仅即时模式且已答题后显示 */}
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
              <p><strong>正确答案：</strong>{currentQuestion.answer}</p>
              <p><strong>你的答案：</strong>{userAnswer?.userAnswer || '未作答'}</p>
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 - 上一题/下一题导航 */}
      <div className="quiz-footer">
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

export default QuizPage;
