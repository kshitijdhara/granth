import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, type Document } from '../../services/documentsApi';
import { blocksAPI} from '../../services/blocksApi';
import { proposalsAPI } from '../../../proposals/services/proposalsApi';
import type { Block as BlockType } from '../../types/blocks';
import Button from '../../../../shared/components/Button/Button';
import Block from '../../components/Block/Block';
import ProposalForm from '../../components/ProposalForm';
import { DocumentLayout } from '../../../../shared/components';
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
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [addingAt, setAddingAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  // Proposal related
  const [changes, setChanges] = useState<Array<{ action: 'create' | 'update' | 'delete'; block: BlockType }>>([]);
  const [showProposalForm, setShowProposalForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const doc = await documentsAPI.getDocument(id);
        setDocument(doc);
        setTitle(doc.title || '');
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

  const handleCreateProposal = async (data: { title: string; intent: string; scope: string }) => {
    if (!id || changes.length === 0) return;
    setSaving(true);
    try {
      // Create proposal
      const affectedBlockIds = changes
        .filter(c => c.action !== 'create')
        .map(c => c.block.id)
        .filter((id, idx, arr) => arr.indexOf(id) === idx); // unique

      const { proposal_id } = await proposalsAPI.createProposal(id, {
        title: data.title || 'Proposal',
        intent: data.intent || 'Edit document',
        scope: data.scope || 'Document changes',
        affected_block_ids: affectedBlockIds,
      });

      // Add block changes
      for (const change of changes) {
        await proposalsAPI.addBlockChange(proposal_id, {
          block_id: change.action === 'create' ? null : change.block.id,
          action: change.action,
          block_type: change.block.block_type,
          order_path: change.block.order_path || [],
          content: change.block.content,
        });
      }

      navigate(`/documents/${id}`);
    } catch (err) {
      console.error('Failed to create proposal', err);
      alert('Failed to create proposal');
    } finally {
      setSaving(false);
      setShowProposalForm(false);
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

      const newBlock: BlockType = {
        id: `temp-${Date.now()}`, // temporary ID
        document_id: id,
        content: '',
        block_type: type,
        order_path: newOrderPath,
        created_by: '', // will be set on proposal
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: '',
      };

      setBlocks(prev => [...prev, newBlock]);
      setChanges(prev => [...prev, { action: 'create', block: newBlock }]);
    } finally {
      setAdding(false);
    }
  };

  const handleBlockContentChange = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const handleUpdateBlock = async (block: BlockType) => {
    // Check if already in changes
    setChanges(prev => {
      const existing = prev.find(c => c.block.id === block.id);
      if (existing) {
        return prev.map(c => c.block.id === block.id ? { ...c, block } : c);
      } else {
        return [...prev, { action: 'update', block }];
      }
    });
  };

  const handleDeleteBlock = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    setChanges(prev => [...prev, { action: 'delete', block }]);
  };

  if (loading) return <p>Loading...</p>;
  if (!document) return <p>Document not found.</p>;

  return (
    <DocumentLayout>
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
            <Button variant="primary" size="medium" onClick={() => setShowProposalForm(true)} isDisabled={changes.length === 0} isFullWidth={false}>
              Create Proposal
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

        <ProposalForm
          isOpen={showProposalForm}
          onClose={() => setShowProposalForm(false)}
          onSubmit={handleCreateProposal}
          isSubmitting={saving}
        />
      </div>
    </DocumentLayout>
  );
};

export default DocumentEditor;
