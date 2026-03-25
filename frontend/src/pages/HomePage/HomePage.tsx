import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button/Button';
import { Card } from '../../shared/components';
import { documentsAPI, type Document } from '../../features/documents/services/documentsApi';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/solid';
import './HomePage.scss';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await documentsAPI.getAllDocuments();
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
    if (creating) return;
    setCreating(true);
    try {
      const result = await documentsAPI.createDocument('Untitled Document');
      if (result?.document_id) navigate(`/documents/${result.document_id}/edit`);
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="home-page">
      <div className="home-page__container">
        <header className="home-page__header">
          <h1 className="home-page__title">Your workspace</h1>
          <p className="home-page__subtitle">Create, edit, and propose changes to documents.</p>
        </header>

        <main className="home-page__content">
          <div className="home-page__actions">
            <Button
              variant="primary"
              size="medium"
              onClick={handleCreateDocument}
              isDisabled={creating}
              isFullWidth={false}
            >
              <PlusIcon style={{ width: 16, height: 16 }} />
              {creating ? 'Creating…' : 'New Document'}
            </Button>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => navigate('/documents')}
              isFullWidth={false}
            >
              All Documents
            </Button>
          </div>

          <section className="home-page__documents">
            <div className="home-page__section-header">
              <h2 className="home-page__section-title">Recent Documents</h2>
            </div>

            {loading ? (
              <div className="home-page__skeleton-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="home-page__skeleton-card" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="home-page__empty">
                <DocumentTextIcon className="home-page__empty-icon" />
                <h3 className="home-page__empty-title">No documents yet</h3>
                <p className="home-page__empty-text">Create your first document to get started.</p>
                <Button variant="primary" size="medium" onClick={handleCreateDocument} isDisabled={creating}>
                  <PlusIcon style={{ width: 16, height: 16 }} />
                  Create Document
                </Button>
              </div>
            ) : (
              <div className="home-page__documents-grid">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    variant="default"
                    padding="md"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="home-page__document-card"
                  >
                    <div className="home-page__document-icon">
                      <DocumentTextIcon />
                    </div>
                    <h3 className="home-page__document-title">{doc.title}</h3>
                    <p className="home-page__document-meta">
                      {formatDate(doc.updated_at || doc.created_at)}
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
