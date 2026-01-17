import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: '', label: 'Dashboard', icon: '📊' },
    { path: 'identity', label: 'Identity', icon: '👤' },
    { path: 'vision', label: 'Vision', icon: '🎯' },
    { path: 'profile', label: 'Profile', icon: '⚙️' },
    { path: 'journals', label: 'Journals', icon: '📝' },
    { path: 'habits', label: 'Habits', icon: '✅' },
    { path: 'tasks', label: 'Tasks', icon: '📋' },
    { path: 'reviews', label: 'Reviews', icon: '🔍' },
    { path: 'health', label: 'Health', icon: '💪' },
    { path: 'documents', label: 'Documents', icon: '📁' },
    { path: 'projects', label: 'Projects', icon: '🚀' },
        { path: 'financial', label: 'Financial', icon: '💰' },
        { path: 'spiritual', label: 'Spiritual', icon: '🙏' },
        { path: 'career', label: 'Career', icon: '💼' },
        { path: 'technical-growth', label: 'Technical Growth', icon: '🧠' },
        { path: 'relational-patterns', label: 'Relational Patterns', icon: '🤝' },
        { path: 'books', label: 'Books', icon: '📚' },
        { path: 'immigration', label: 'Immigration', icon: '🌍' },
        { path: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div className="layout">
      <Navbar />
      <div className="layout-body">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1><strong>LifeOS</strong></h1>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const fullPath = item.path === '' ? '/dashboard' : `/dashboard/${item.path}`;
              const isActive = location.pathname === fullPath;
              return (
                <Link
                  key={item.path || 'dashboard'}
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          {/* Removed logout button from sidebar - it's in Navbar */}
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
