import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { documentsAPI, type Document } from '../../../features/documents/services/documentsApi';
import { ArrowLeftEndOnRectangleIcon, ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/solid';
import './Sidebar.scss';

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


  const handleLogout = async () => {
    await logout();
  };

  const handleDocumentClick = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  const handleCreateDocument = async () => {
    try {
      const result = await documentsAPI.createDocument('New Document');
      alert(`Document created with ID: ${result.document_id}`);
      // Refresh the documents list
      const updatedDocs = await documentsAPI.getAllDocuments();
      setDocuments(updatedDocs);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document');
    }
  };
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return null;
  }

  return (
    <nav className={`navbar ${sidebarOpen ? 'navbar--open' : 'navbar--closed'}`}>
      <div className="navbar__container">
        <div className="navbar__header">
          <Button
            className="navbar__toggle-btn"
            variant="secondary"
            size="small"
            onClick={toggleSidebar}
            isFullWidth={false}
          >
            {sidebarOpen ? <ArrowLeftEndOnRectangleIcon className="icon" /> : <ArrowRightEndOnRectangleIcon className="icon" />}
          </Button>
          
          {sidebarOpen && <h1 className="navbar__brand" onClick={() => navigate("/home")}>Granth</h1>}
        </div>
        {sidebarOpen && (
          <div className="navbar__content">
            {isAuthenticated ? (
              <>
                <div className="navbar__documents">
                  <div className="navbar__section">
                    <h2 className="navbar__section-title">Documents</h2>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={handleCreateDocument}
                      isFullWidth={true}
                    >
                      New Document
                    </Button>
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
                      onClick={() => navigate('/profile')}
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
              </>
            ) : (
              <div className="navbar__actions">
                <div className="navbar__section">
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={() => navigate('/login')}
                    isFullWidth={true}
                  >
                    Login
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;