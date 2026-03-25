import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { documentsAPI, type Document } from '../../../features/documents/services/documentsApi';
import {
  HomeIcon,
  DocumentTextIcon,
  UserCircleIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/solid';
import { useTheme } from '../../contexts/ThemeContext';
import './Sidebar.scss';

interface NavbarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      documentsAPI.getAllDocuments()
        .then(setDocuments)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
  };

  const handleDocumentClick = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  const handleCreateDocument = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const result = await documentsAPI.createDocument('Untitled Document');
      const updatedDocs = await documentsAPI.getAllDocuments();
      setDocuments(updatedDocs);
      if (result?.document_id) navigate(`/documents/${result.document_id}/edit`);
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setCreating(false);
    }
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage) return null;

  const isActive = (path: string) =>
    path === '/home'
      ? location.pathname === '/home' || location.pathname === '/'
      : location.pathname.startsWith(path);

  return (
    <nav className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--closed'}`} aria-label="Main navigation">
      <div className="sidebar__inner">

        {/* Header */}
        <div className="sidebar__header">
          <button
            className="sidebar__toggle"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <XMarkIcon className="sidebar__icon" /> : <Bars3Icon className="sidebar__icon" />}
          </button>
          {sidebarOpen && (
            <span className="sidebar__brand" onClick={() => navigate('/home')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/home')}>
              Granth
            </span>
          )}
        </div>

        {/* Nav links */}
        <nav className="sidebar__nav" aria-label="Primary navigation">
          <button
            className={`sidebar__nav-item ${isActive('/home') ? 'sidebar__nav-item--active' : ''}`}
            onClick={() => navigate('/home')}
            title="Home"
          >
            <HomeIcon className="sidebar__icon" />
            {sidebarOpen && <span className="sidebar__nav-label">Home</span>}
          </button>

          <button
            className={`sidebar__nav-item ${isActive('/documents') ? 'sidebar__nav-item--active' : ''}`}
            onClick={() => navigate('/documents')}
            title="Documents"
          >
            <DocumentTextIcon className="sidebar__icon" />
            {sidebarOpen && <span className="sidebar__nav-label">Documents</span>}
          </button>
        </nav>

        {/* Documents list */}
        {sidebarOpen && isAuthenticated && (
          <div className="sidebar__documents">
            <div className="sidebar__section-header">
              <span className="sidebar__section-title">Recent</span>
              <button
                className="sidebar__new-btn"
                onClick={handleCreateDocument}
                disabled={creating}
                title="New document"
                aria-label="New document"
              >
                <PlusIcon className="sidebar__icon sidebar__icon--sm" />
              </button>
            </div>

            {loading ? (
              <div className="sidebar__loading">
                <div className="sidebar__skeleton" />
                <div className="sidebar__skeleton" />
                <div className="sidebar__skeleton" />
              </div>
            ) : documents.length > 0 ? (
              <ul className="sidebar__doc-list" role="list">
                {documents.slice(0, 12).map((doc) => (
                  <li key={doc.id}>
                    <button
                      className={`sidebar__doc-item ${location.pathname.includes(doc.id) ? 'sidebar__doc-item--active' : ''}`}
                      onClick={() => handleDocumentClick(doc.id)}
                      title={doc.title}
                    >
                      <span className="sidebar__doc-icon">
                        <DocumentTextIcon style={{ width: 12, height: 12 }} />
                      </span>
                      <span className="sidebar__doc-title">{doc.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sidebar__empty">No documents yet</p>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="sidebar__footer">
          <button
            className="sidebar__nav-item sidebar__nav-item--theme"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light'
              ? <MoonIcon className="sidebar__icon" />
              : <SunIcon className="sidebar__icon" />}
            {sidebarOpen && (
              <span className="sidebar__nav-label">
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <>
              <button
                className={`sidebar__nav-item ${isActive('/profile') ? 'sidebar__nav-item--active' : ''}`}
                onClick={() => navigate('/profile')}
                title="Profile"
              >
                <UserCircleIcon className="sidebar__icon" />
                {sidebarOpen && <span className="sidebar__nav-label">Profile</span>}
              </button>

              <button
                className="sidebar__nav-item sidebar__nav-item--logout"
                onClick={handleLogout}
                title="Sign out"
              >
                <ArrowRightStartOnRectangleIcon className="sidebar__icon" />
                {sidebarOpen && <span className="sidebar__nav-label">Sign out</span>}
              </button>
            </>
          ) : (
            <button
              className="sidebar__nav-item sidebar__nav-item--active"
              onClick={() => navigate('/login')}
              title="Sign in"
            >
              <ArrowRightStartOnRectangleIcon className="sidebar__icon" />
              {sidebarOpen && <span className="sidebar__nav-label">Sign in</span>}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
