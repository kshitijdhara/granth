import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, type Document } from '../../services/documentsApi';
import { blocksAPI } from '../../services/blocksApi';
import type { Block as BlockType } from '../../types/blocks';
import Button from '../../../../shared/components/Button/Button';
import Block from '../../components/Block/Block';
import './DocumentDetail.scss';

const compareOrderPaths = (a: number[], b: number[]): number => {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
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
        // load blocks for this document and sort by order
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
    if (!confirm('Delete this document?')) return;
    try {
      await documentsAPI.deleteDocument(id);
      navigate('/documents');
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!document) return <p>Document not found.</p>;

  return (
    <div className="document-detail">
      <header className="document-detail__header">
        <h1 className="document-detail__title">{document.title}</h1>
        <div className="document-detail__actions">
          <Button variant="secondary" size="small" onClick={() => navigate(`/documents/${document.id}/edit`)} isFullWidth={false}>Edit</Button>
          <Button variant="secondary" size="small" onClick={handleDelete} isFullWidth={false}>Delete</Button>
        </div>
      </header>

      <main className="document-detail__content">
        <div className="document-detail__meta">Created: {new Date(document.created_at).toLocaleString()}</div>

        <div className="document-detail__blocks">
          {blocks.length === 0 ? (
            <em>No blocks yet</em>
          ) : (
            blocks.map((blk) => (
              <Block key={blk.id} block={blk} isEditing={false} />
            ))
          )}
        </div>

        <div className="document-detail__meta">Updated: {new Date(document.updated_at).toLocaleString()}</div>
      </main>
    </div>
  );
};

export default DocumentDetail;
