import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, type Document } from '../../services/documentsApi';
import { blocksAPI} from '../../services/blocksApi';
import type { Block as BlockType } from '../../types/blocks';
import Button from '../../../../shared/components/Button/Button';
import Block from '../../components/Block/Block';
import './DocumentEditor.scss';

const compareOrderPaths = (a: number[], b: number[]): number => {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
};

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
  const [adding, setAdding] = useState(false);

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
      b.sort((x, y) => compareOrderPaths(x.order_path ?? [], y.order_path ?? []));
      setBlocks(b);
    } catch (err) {
      console.error('Failed to reload blocks', err);
    }
  };

  const handleAddBlock = async (parentId: string | null, type: string) => {
    if (adding) return;
    setAdding(true);
    try {
      if (!id) return;
      let newOrderPath: number[];
      if (parentId === null) {
        // add at root
        let newOrder = 1000;
        if (blocks.length > 0) {
          const max = Math.max(...blocks.map(b => b.order_path?.[0] ?? 0));
          newOrder = max + 1000;
        }
        newOrderPath = [newOrder];
      } else {
        // add as child
        const parentBlock = blocks.find(b => b.id === parentId);
        if (!parentBlock) return;
        // find children
        const children = blocks.filter(b => 
          b.order_path.length === parentBlock.order_path.length + 1 &&
          b.order_path.slice(0, parentBlock.order_path.length).every((v, i) => v === parentBlock.order_path[i])
        );
        let nextChild = 1;
        if (children.length > 0) {
          const maxChild = Math.max(...children.map(b => b.order_path[parentBlock.order_path.length]));
          nextChild = maxChild + 1;
        }
        newOrderPath = [...parentBlock.order_path, nextChild];
      }

      const newBlock: Partial<BlockType> = {
        content: '',
        block_type: type,
        order_path: newOrderPath,
      };

      await blocksAPI.createBlock(id, newBlock);
      await reloadBlocks();
    } finally {
      setAdding(false);
    }
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
              <Block block={blk} isEditing={true} onContentChange={handleBlockContentChange} onSave={handleUpdateBlock} onAddBlock={handleAddBlock} onDeleteBlock={handleDeleteBlock} isAdding={adding} />
            </div>
          ))}

          {/* add at end */}
          <div className="document-editor__add-end">
            <button className="document-editor__add-btn" onClick={() => setAddingAt('END')} disabled={adding}>+</button>
            {addingAt === 'END' && (
              <div className="document-editor__add-menu">
                <button onClick={() => handleAddBlock(null, 'text')} disabled={adding}>Text</button>
                <button onClick={() => handleAddBlock(null, 'heading')} disabled={adding}>Heading</button>
                <button onClick={() => handleAddBlock(null, 'code')} disabled={adding}>Code</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentEditor;
