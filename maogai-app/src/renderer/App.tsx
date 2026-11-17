import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ChapterPage from './pages/ChapterPage';
import PracticePage from './pages/PracticePage';
import ExamPage from './pages/ExamPage';
import WrongAnswersPage from './pages/WrongAnswersPage';
import RecordsPage from './pages/RecordsPage';
import ResultPage from './pages/ResultPage';
import './styles/global.css';

function App() {
  const { loadData, isLoading, error } = useStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">加载题库中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading">
        <div className="text-danger" style={{ fontSize: 18, marginBottom: 16 }}>
          加载失败
        </div>
        <div className="text-secondary">{error}</div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chapter/:chapterIndex" element={<ChapterPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/wrong-answers" element={<WrongAnswersPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
