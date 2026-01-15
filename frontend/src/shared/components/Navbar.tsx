import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.scss';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, username, logout } = useAuth();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      // Navigate to profile (for now, just show an alert)
      alert('Profile functionality coming soon!');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Don't show navbar on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__left">
          <Button
            variant="secondary"
            size="medium"
            onClick={handleAuthAction}
            isFullWidth={false}
          >
            {isAuthenticated ? `Profile` : 'Sign In'}
          </Button>
        </div>
        <div className="navbar__center">
          <h1 className="navbar__brand">Granth</h1>
        </div>
        <div className="navbar__right">
          {isAuthenticated && (
            <Button
              variant="secondary"
              size="small"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;