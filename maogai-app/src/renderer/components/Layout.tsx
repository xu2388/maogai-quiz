import type { ReactNode, FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  History,
  AlertCircle,
  Home,
  GraduationCap
} from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/exam', icon: GraduationCap, label: '考试模式' },
  { path: '/wrong-answers', icon: AlertCircle, label: '错题本' },
  { path: '/records', icon: History, label: '历史记录' },
];

const Layout: FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="layout">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <BookOpen className="sidebar-logo" size={28} />
          <h1 className="sidebar-title">毛概刷题</h1>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="sidebar-footer">
          <div className="version">v1.0.0</div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
