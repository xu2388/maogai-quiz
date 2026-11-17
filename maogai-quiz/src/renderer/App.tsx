import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ChapterDetail from './pages/ChapterDetail';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import WrongAnswersPage from './pages/WrongAnswersPage';
import Records from './pages/Records';

const App = () => {
  const loadData = useStore((s) => s.loadData);
  const questionBank = useStore((s) => s.questionBank);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!questionBank) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chapter/:idx" element={<ChapterDetail />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/wrong" element={<WrongAnswersPage />} />
        <Route path="/records" element={<Records />} />
      </Routes>
    </Layout>
  );
};

export default App;
