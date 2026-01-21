import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI, type Document } from '../../services/documentsApi';
import Button from '../../../../shared/components/Button/Button';
import './DocumentList.scss';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await documentsAPI.getAllDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await documentsAPI.createDocument('New Document');
      // reload
      await loadDocuments();
      // navigate to the new document if id returned
      if (res?.document_id) navigate(`/documents/${res.document_id}/edit`);
    } catch (err) {
      console.error('Failed to create document', err);
    }
  };

  return (
    <div className="documents-page">
      <header className="documents-page__header">
        <h1 className="documents-page__title">Documents</h1>
        <Button variant="primary" size="medium" onClick={handleCreate} isFullWidth={false}>
          New Document
        </Button>
      </header>

      <main className="documents-page__content">
        {loading ? (
          <p>Loading...</p>
        ) : documents.length === 0 ? (
          <p>No documents yet</p>
        ) : (
          <ul className="documents-page__list">
            {documents.map((d) => (
              <li key={d.id} className="documents-page__item">
                <button
                  className="documents-page__link"
                  onClick={() => navigate(`/documents/${d.id}`)}
                >
                  <div className="documents-page__title">{d.title}</div>
                  <div className="documents-page__meta">{new Date(d.created_at).toLocaleString()}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default DocumentsPage;
