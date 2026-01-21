import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button/Button';
import { Card } from '../../shared/components';
import { documentsAPI, type Document } from '../../features/documents/services/documentsApi';
import './HomePage.scss';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await documentsAPI.getAllDocuments();
        // Sort by created_at descending and take first 10
        const sortedDocs = docs
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);
        setDocuments(sortedDocs);
      } catch (error) {
        console.error('Failed to load documents:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  const handleCreateDocument = async () => {
    try {
      const result = await documentsAPI.createDocument('New Document');
      if (result?.document_id) navigate(`/documents/${result.document_id}/edit`);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document');
    }
  };

  const handleDocumentClick = (documentId: string) => {
    navigate(`/documents/${documentId}`);
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

          <section className="home-page__documents">
            <h2>Recent Documents</h2>
            {loading ? (
              <p>Loading documents...</p>
            ) : documents.length === 0 ? (
              <p>No documents yet. Create your first one!</p>
            ) : (
              <div className="home-page__documents-grid">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    variant="default"
                    padding="md"
                    onClick={() => handleDocumentClick(doc.id)}
                    className="home-page__document-card"
                  >
                    <h3 className="home-page__document-title">{doc.title}</h3>
                    <p className="home-page__document-meta">
                      Created: {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomePage;