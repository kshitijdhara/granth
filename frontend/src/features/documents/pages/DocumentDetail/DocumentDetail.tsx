import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, type Document } from '../../services/documentsApi';
import { blocksAPI } from '../../services/blocksApi';
import type { Block as BlockType } from '../../types/blocks';
import Button from '../../../../shared/components/Button/Button';
import { DocumentLayout } from '../../../../shared/components';
import Block from '../../components/Block/Block';
import { ProposalsView } from '../../../proposals';
import './DocumentDetail.scss';

const compareOrderPaths = (a: number[], b: number[]): number => {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
};

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<BlockType[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const doc = await documentsAPI.getDocument(id);
        setDocument(doc);
        try {
          const b = await blocksAPI.getAllBlocks(id);
          b.sort((x, y) => compareOrderPaths(x.order_path ?? [], y.order_path ?? []));
          setBlocks(b);
        } catch (err) {
          console.error('Failed to load blocks', err);
          setBlocks([]);
        }
      } catch (err) {
        console.error('Failed to load document', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Delete this document? This cannot be undone.')) return;
    try {
      await documentsAPI.deleteDocument(id);
      navigate('/documents');
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

  if (loading) return <div className="document-detail-loading">Loading document…</div>;
  if (!document) return <div className="document-detail-notfound">Document not found.</div>;

  return (
    <div className="document-detail-page">
      <div className="document-detail-page__main">
        <DocumentLayout>
          <div className="document-detail">
            <header className="document-detail__header">
              <div className="document-detail__title-group">
                <h1 className="document-detail__title">{document.title}</h1>
                <div className="document-detail__date">
                  <span>Created {formatDate(document.created_at)}</span>
                  {document.updated_at !== document.created_at && (
                    <span>· Updated {formatDate(document.updated_at)}</span>
                  )}
                </div>
              </div>
              <div className="document-detail__actions">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(`/documents/${document.id}/edit`)}
                  isFullWidth={false}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleDelete}
                  isFullWidth={false}
                >
                  Delete
                </Button>
              </div>
            </header>

            <main className="document-detail__content">
              <div className="document-detail__blocks">
                {blocks.length === 0 ? (
                  <p className="document-detail__empty">No content yet. Start editing to add blocks.</p>
                ) : (
                  blocks.map((blk) => (
                    <Block key={blk.id} block={blk} isEditing={false} />
                  ))
                )}
              </div>
            </main>
          </div>
        </DocumentLayout>
      </div>

      <div className="document-detail-page__sidebar">
        <ProposalsView documentId={document.id} />
      </div>
    </div>
  );
};

export default DocumentDetail;
