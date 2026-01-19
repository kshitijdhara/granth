import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { documentsAPI, type Document } from '../../../services/documentsApi';
import './Navbar.scss';

interface NavbarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      documentsAPI.getAllDocuments()
        .then(setDocuments)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

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

  const handleDocumentClick = (documentId: string) => {
    // For now, just alert
    alert(`Document ${documentId} clicked`);
  };

  // Don't show navbar on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return null;
  }

  return (
    <nav className={`navbar ${sidebarOpen ? 'navbar--open' : 'navbar--closed'}`}>
      <div className="navbar__container">
        <div className="navbar__header">
          <Button
            variant="secondary"
            size="small"
            onClick={toggleSidebar}
            isFullWidth={false}
          >
            {sidebarOpen ? '←' : '→'}
          </Button>
          {sidebarOpen && <h1 className="navbar__brand">Granth</h1>}
        </div>
        {sidebarOpen && (
          <div className="navbar__content">
            <div className="navbar__documents">
              <div className="navbar__section">
                <h2 className="navbar__section-title">Documents</h2>
                {loading ? (
                  <p>Loading...</p>
                ) : documents.length > 0 ? (
                  <ul className="navbar__document-list">
                    {documents.map((doc) => (
                      <li key={doc.id} className="navbar__document-item">
                        <button
                          className="navbar__document-link"
                          onClick={() => handleDocumentClick(doc.id)}
                        >
                          {doc.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No documents yet</p>
                )}
              </div>
            </div>
            <div className="navbar__actions">
              <div className="navbar__section">
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={handleAuthAction}
                  isFullWidth={true}
                >
                  Profile
                </Button>
              </div>
              <div className="navbar__section">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleLogout}
                  isFullWidth={true}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;