import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, AlertCircle, History } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/exam', icon: GraduationCap, label: '考试模式' },
  { path: '/wrong-answers', icon: AlertCircle, label: '错题本' },
  { path: '/records', icon: History, label: '练习记录' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">毛</div>
          <h1>毛概刷题</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`nav-item ${active ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">v1.0.0 · 共255题</div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
