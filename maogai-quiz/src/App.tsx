import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ChapterPage from './pages/ChapterPage';
import QuizPage from './pages/QuizPage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import WrongAnswersPage from './pages/WrongAnswersPage';
import RecordsPage from './pages/RecordsPage';

export default function App() {
  const loadData = useStore(s => s.loadData);
  const loaded = useStore(s => s.loaded);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6e6e73', fontSize: 16 }}>加载中...</p>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chapter/:index" element={<ChapterPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/wrong-answers" element={<WrongAnswersPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
