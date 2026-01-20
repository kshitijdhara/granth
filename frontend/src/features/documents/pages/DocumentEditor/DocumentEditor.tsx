import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, type Document } from '../../services/documentsApi';
import { blocksAPI} from '../../services/blocksApi';
import type { Block as BlockType } from '../../types/blocks';
import Button from '../../../../shared/components/Button/Button';
import Block from '../../components/Block/Block';
import './DocumentEditor.scss';

const DocumentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [addingAt, setAddingAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const doc = await documentsAPI.getDocument(id);
        setDocument(doc);
        setTitle(doc.title || '');
        setContent(doc.content || '');
        // load blocks
        try {
          const b = await blocksAPI.getAllBlocks(id);
          b.sort((x, y) => (x.order_path ?? 0) - (y.order_path ?? 0));
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

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await documentsAPI.updateDocument(id, { title, content });
      navigate(`/documents/${id}`);
    } catch (err) {
      console.error('Failed to save document', err);
      alert('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const reloadBlocks = async () => {
    if (!id) return;
    try {
      const b = await blocksAPI.getAllBlocks(id);
      b.sort((x, y) => (x.order_path ?? 0) - (y.order_path ?? 0));
      setBlocks(b);
    } catch (err) {
      console.error('Failed to reload blocks', err);
    }
  };

  const handleAddBlock = async (afterBlockId: string | null, type: string) => {
    if (!id) return;
    // determine order
    let newOrder = 1;
    if (afterBlockId === null) {
      // add at end
      newOrder = blocks.length > 0 ? (blocks[blocks.length - 1].order_path ?? 0) + 1 : 1;
    } else {
      const idx = blocks.findIndex((b) => b.id === afterBlockId);
      if (idx === -1) {
        newOrder = blocks.length > 0 ? (blocks[blocks.length - 1].order_path ?? 0) + 1 : 1;
      } else {
        const next = blocks[idx + 1];
        const prev = blocks[idx];
        if (next) {
          newOrder = ((prev.order_path ?? 0) + (next.order_path ?? 0)) / 2;
        } else {
          newOrder = (prev.order_path ?? 0) + 1;
        }
      }
    }

    const newBlock: Partial<BlockType> = {
      content: '',
      block_type: type,
      order_path: newOrder,
    };

    await blocksAPI.createBlock(id, newBlock);
    await reloadBlocks();
  };

  const handleBlockContentChange = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const handleUpdateBlock = async (block: BlockType) => {
    if (!id) return;
    await blocksAPI.updateBlock(id, block);
    await reloadBlocks();
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!id) return;
    await blocksAPI.deleteBlock(id, blockId);
    await reloadBlocks();
  };

  if (loading) return <p>Loading...</p>;
  if (!document) return <p>Document not found.</p>;

  return (
    <div className="document-editor">
      <header className="document-editor__header">
        <input
          className="document-editor__title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title"
        />
        <div className="document-editor__actions">
          <Button variant="secondary" size="small" onClick={() => navigate(`/documents/${id}`)} isFullWidth={false}>Cancel</Button>
          <Button variant="primary" size="medium" onClick={handleSave} isFullWidth={false}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <main className="document-editor__content">
        <div className="document-editor__blocks">
          {blocks.map((blk) => (
            <div key={blk.id} className="document-editor__block">
              <Block block={blk} isEditing={true} onContentChange={handleBlockContentChange} onSave={handleUpdateBlock} onAddBlock={handleAddBlock} onDeleteBlock={handleDeleteBlock} />
            </div>
          ))}

          {/* add at end */}
          <div className="document-editor__add-end">
            <button className="document-editor__add-btn" onClick={() => setAddingAt('END')}>+</button>
            {addingAt === 'END' && (
              <div className="document-editor__add-menu">
                <button onClick={() => handleAddBlock(null, 'text')}>Text</button>
                <button onClick={() => handleAddBlock(null, 'heading')}>Heading</button>
                <button onClick={() => handleAddBlock(null, 'code')}>Code</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentEditor;
