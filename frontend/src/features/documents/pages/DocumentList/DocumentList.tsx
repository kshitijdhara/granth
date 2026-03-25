import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI, type Document } from '../../services/documentsApi';
import Button from '../../../../shared/components/Button/Button';
import { DocumentTextIcon, PlusIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import './DocumentList.scss';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await documentsAPI.getAllDocuments();
      docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await documentsAPI.createDocument('Untitled Document');
      await loadDocuments();
      if (res?.document_id) navigate(`/documents/${res.document_id}/edit`);
    } catch (err) {
      console.error('Failed to create document', err);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="documents-page">
      <header className="documents-page__header">
        <h1 className="documents-page__heading">Documents</h1>
        <Button variant="primary" size="medium" onClick={handleCreate} isDisabled={creating} isFullWidth={false}>
          <PlusIcon style={{ width: 16, height: 16 }} />
          {creating ? 'Creating…' : 'New Document'}
        </Button>
      </header>

      <main className="documents-page__content">
        {loading ? (
          <div className="documents-page__loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="documents-page__skeleton" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="documents-page__empty">
            No documents yet — create one to get started.
          </p>
        ) : (
          <ul className="documents-page__list" role="list">
            {documents.map((d) => (
              <li key={d.id} className="documents-page__item">
                <button
                  className="documents-page__link"
                  onClick={() => navigate(`/documents/${d.id}`)}
                  aria-label={`Open ${d.title}`}
                >
                  <div className="documents-page__link-icon">
                    <DocumentTextIcon />
                  </div>
                  <div className="documents-page__link-body">
                    <div className="documents-page__title">{d.title}</div>
                    <div className="documents-page__meta">{formatDate(d.created_at)}</div>
                  </div>
                  <ChevronRightIcon className="documents-page__link-arrow" />
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
