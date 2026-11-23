import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../context/AuthContext';
import api from '../services/api';
import GlobalSearch from './GlobalSearch';
// Notifications removed per design doc - only immigration deadlines are kept (handled in Immigration module)
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  // Notifications removed per design doc - only immigration deadlines are kept (handled in Immigration module)

  // Fetch profile to get name and avatar
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles').then(res => res.data),
    enabled: isAuthenticated && location.pathname.startsWith('/dashboard'),
  });

  // Show navbar on all pages, but with different content based on authentication
  if (!isAuthenticated || !location.pathname.startsWith('/dashboard')) {
    // Show landing page navbar with CTA
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <strong>LifeOS</strong>
          </Link>
          <div className="navbar-links">
            <Link to="/faq" className="navbar-link">FAQ</Link>
            <Link to="/login" className="navbar-link">Sign In</Link>
            <Link to="/register" className="navbar-cta-btn">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const displayName = profile?.preferredName || profile?.preferred_name || profile?.fullName || profile?.full_name || user?.email || 'User';
  const avatarUrl = profile?.profileImageUrl || profile?.profile_image_url;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <strong>LifeOS</strong>
        </Link>
        <div className="navbar-links">
          <button onClick={() => setShowSearch(true)} className="navbar-search-btn" title="Global Search">
            🔍
          </button>
          <span className="navbar-welcome">
            Welcome back, {displayName}
          </span>
          <Link to="/dashboard/profile" className="navbar-avatar-link">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="navbar-avatar" />
            ) : (
              <div className="navbar-avatar-placeholder">
                {displayName[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </Link>
          <button onClick={logout} className="navbar-link navbar-link-logout">
            Logout
          </button>
        </div>
      </div>
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
    </nav>
  );
};

export default Navbar;
