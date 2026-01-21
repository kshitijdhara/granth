import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button/Button';
import { documentsAPI } from '../../features/documents/services/documentsApi';
import './HomePage.scss';

const HomePage: React.FC = () => {

  const navigate = useNavigate();

  const handleCreateDocument = async () => {
    try {
      const result = await documentsAPI.createDocument('New Document');
      if (result?.document_id) navigate(`/documents/${result.document_id}/edit`);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document');
    }
  };

  return (
    <div className="home-page">
      <div className="home-page__container">
        <header className="home-page__header">
          <h1 className="home-page__title">Granth</h1>
          <p className="home-page__subtitle">Documents and proposals</p>
        </header>

        <main className="home-page__content">
          <div className="home-page__actions">
            <Button
              variant="primary"
              size="medium"
              onClick={handleCreateDocument}
              isFullWidth={false}
            >
              Create New Document
            </Button>
          </div>
          <section className="home-page__section">
            <h2>Notes</h2>
            <p>Create and organize your thoughts</p>
          </section>
          <section className="home-page__section">
            <h2>Search</h2>
            <p>Find anything instantly</p>
          </section>
          <section className="home-page__section">
            <h2>Collaborate</h2>
            <p>Work with your team</p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomePage;