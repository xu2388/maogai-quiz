import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, AlertCircle, History } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/exam', icon: GraduationCap, label: '考试' },
  { path: '/wrong-answers', icon: AlertCircle, label: '错题' },
  { path: '/records', icon: History, label: '记录' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // 答题页和结果页使用全屏布局，隐藏底部导航
  const isFullScreen = location.pathname === '/quiz' || location.pathname === '/result';

  if (isFullScreen) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <main className="main-content">
        {children}
      </main>
      <nav className="bottom-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path ||
            (item.path === '/' && location.pathname.startsWith('/chapter'));
          return (
            <Link key={item.path} to={item.path} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}