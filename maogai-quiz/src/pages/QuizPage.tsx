import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
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
    questionBank,
    startQuiz: _startQuiz,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    finishQuiz,
    addWrongAnswer,
    removeWrongAnswer,
  } = useStore();

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(0);

  const optionKeys = Object.keys(currentQuestions[currentIndex]?.options || {});

  // 如果没有题目，返回首页
  useEffect(() => {
    if (currentQuestions.length === 0) {
      navigate('/');
    }
  }, [currentQuestions, navigate]);

  // 切换题目时重置选项和聚焦
  useEffect(() => {
    const current = currentQuestions[currentIndex];
    if (current) {
      const existing = userAnswers.get(current.id);
      setSelectedOptions(existing ? existing.userAnswer.split('') : []);
      setFocusedOptionIndex(0);
    }
  }, [currentIndex, currentQuestions, userAnswers]);

  // 键盘事件：方向键移动焦点，回车选择/提交
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentQuestions.length === 0) return;
      const question = currentQuestions[currentIndex];
      if (!question) return;
      const userAnswer = userAnswers.get(question.id);
      const isAnswered = !!userAnswer;
      const canShowAnswer = mode === 'practice' && answerMode === 'immediate';
      const keys = optionKeys;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedOptionIndex(prev => (prev > 0 ? prev - 1 : keys.length - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedOptionIndex(prev => (prev < keys.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (isAnswered && canShowAnswer) {
            // 即时模式下已作答，回车进入下一题
            goNext();
          } else if (selectedOptions.length > 0) {
            handleSubmit();
          } else if (keys.length > 0) {
            // 未选择时，回车选中当前聚焦的选项
            handleSelect(keys[focusedOptionIndex]);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) prevQuestion();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!isAnswered || canShowAnswer) {
            if (selectedOptions.length > 0) {
              handleSubmit();
            } else if (keys.length > 0) {
              handleSelect(keys[focusedOptionIndex]);
            }
          } else {
            goNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestions, currentIndex, optionKeys, focusedOptionIndex, selectedOptions, userAnswers, mode, answerMode]);

  if (currentQuestions.length === 0) return null;

  const question = currentQuestions[currentIndex];
  if (!question) return null;

  const userAnswer = userAnswers.get(question.id);
  const isAnswered = !!userAnswer;
  const isLast = currentIndex === currentQuestions.length - 1;

  // 即时模式：答完就显示答案
  const showAnswer = isAnswered && (mode === 'practice' && answerMode === 'immediate');
  // 延后模式：不显示答案
  const canShowAnswer = mode === 'practice' && answerMode === 'immediate';

  const handleSelect = (key: string) => {
    if (isAnswered && canShowAnswer) return;
    if (question.type === 'single') {
      setSelectedOptions([key]);
    } else {
      setSelectedOptions(prev =>
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key].sort()
      );
    }
  };

  // 获取考试模式下当前题目的原始题目信息
  const getOriginalQuestion = () => {
    if (!examMapping || !questionBank) return question;
    const mapping = examMapping.mappings[question.id];
    if (!mapping) return question;

    const originalChapter = questionBank.chapters.find(c => c.index === question.chapterIndex);
    const originalQuestion = originalChapter?.questions.find(q => q.id === mapping.originalId);
    return originalQuestion || question;
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) return;
    const answer = selectedOptions.join('');
    const isCorrect = answer === question.answer;
    answerQuestion(question.id, answer, isCorrect);

    // 错题记录：考试模式下需要还原为原始题目和原始答案
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

    // 即时模式：显示答案，等待用户点击下一题
    // 延后模式/考试模式：自动进入下一题
    if (!canShowAnswer) {
      goNext();
    }
  };

  const goNext = () => {
    if (isLast) {
      finishQuiz().then(() => navigate('/result'));
    } else {
      nextQuestion();
    }
  };

  const progress = ((currentIndex + 1) / currentQuestions.length) * 100;

  return (
    <div className="quiz-container fade-in">
      {/* 进度条 */}
      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          <span>第 {currentIndex + 1} / {currentQuestions.length} 题</span>
          <span>
            <span className={`mode-badge ${mode}`} style={{ marginRight: 8 }}>
              {mode === 'exam' ? '考试模式' : answerMode === 'immediate' ? '即时练习' : '延后练习'}
            </span>
          </span>
        </div>
      </div>

      {/* 题目卡片 */}
      <div className="question-card">
        <span className={`question-type-tag ${question.type}`}>
          {question.type === 'single' ? '单选题' : '多选题'}
        </span>
        <div className="question-text">{question.question}</div>

        <div className="options-list">
          {Object.entries(question.options).map(([key, text], idx) => {
            const isSelected = selectedOptions.includes(key);
            const isCorrectOpt = question.answer.includes(key);
            const isFocused = idx === focusedOptionIndex && !isAnswered;

            let cls = 'option-item';
            if (showAnswer) {
              if (isCorrectOpt) cls += ' correct';
              else if (isSelected) cls += ' wrong';
            } else if (isSelected) {
              cls += ' selected';
            } else if (isFocused) {
              cls += ' focused';
            }

            return (
              <button
                key={key}
                className={cls}
                onClick={() => {
                  handleSelect(key);
                  setFocusedOptionIndex(idx);
                }}
                disabled={isAnswered && canShowAnswer}
                onMouseEnter={() => setFocusedOptionIndex(idx)}
              >
                <span className="option-key">{key}</span>
                <span className="option-text">{text}</span>
                {showAnswer && isCorrectOpt && <Check size={18} color="#34c759" />}
                {showAnswer && isSelected && !isCorrectOpt && <X size={18} color="#ff3b30" />}
              </button>
            );
          })}
        </div>

        {/* 答案显示 - 仅即时模式 */}
        {showAnswer && (
          <div className={`answer-box ${userAnswer?.isCorrect ? 'correct' : 'wrong'}`}>
            <div className="answer-box-title">
              {userAnswer?.isCorrect ? (
                <><Check size={16} /> 回答正确</>
              ) : (
                <><X size={16} /> 回答错误</>
              )}
            </div>
            <div className="answer-detail">
              <p><strong>正确答案：</strong>{question.answer}</p>
              {!userAnswer?.isCorrect && (
                <p><strong>你的答案：</strong>{userAnswer?.userAnswer}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="quiz-footer">
        <button
          className="btn btn-secondary"
          onClick={prevQuestion}
          disabled={currentIndex === 0}
        >
          <ArrowLeft size={16} /> 上一题
        </button>

        {!isAnswered ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={selectedOptions.length === 0}
          >
            {canShowAnswer ? '提交答案' : (isLast ? '提交并查看结果' : '提交')}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={goNext}>
            {isLast ? '查看结果' : '下一题'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
