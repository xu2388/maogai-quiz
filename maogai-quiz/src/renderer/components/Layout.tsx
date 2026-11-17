import { NavLink } from 'react-router-dom';
import { Home, FileText, BookOpen, History } from 'lucide-react';
import type { ReactNode } from 'react';
import './Layout.css';

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/exam', label: '考试模式', icon: FileText },
  { to: '/wrong', label: '错题本', icon: BookOpen },
  { to: '/records', label: '历史记录', icon: History },
];

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">毛概刷题</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'nav-item active' : 'nav-item'
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
