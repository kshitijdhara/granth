import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Block as BlockType } from '../../types/blocks';
import './Block.scss';

interface BlockProps {
  block: BlockType;
  isEditing: boolean;
  onContentChange?: (id: string, content: string) => void;
  onSave?: (block: BlockType) => void;
  onAddBlock?: (parentId: string | null, type: string) => void;
  onDeleteBlock?: (id: string) => void;
  isAdding?: boolean;
}

const Block: React.FC<BlockProps> = ({ block, isEditing, onContentChange, onSave, onAddBlock, onDeleteBlock, isAdding }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onContentChange) {
      onContentChange(block.id, e.target.value);
    }
  };

  const handleBlur = () => {
    if (onSave) {
      onSave({ ...block, content: block.content });
    }
  };

  if (isEditing) {
    return (
      <div className="block block--editing" style={{ marginLeft: `${(block.order_path?.length ?? 1) * 20 - 20}px` }}>
        {block.block_type === 'heading' && (
          <input
            type="text"
            value={block.content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            className="block__input block__input--heading"
            placeholder="Heading"
          />
        )}
        {block.block_type === 'code' && (
          <textarea
            value={block.content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            className="block__textarea block__textarea--code"
            rows={8}
            placeholder="Code"
          />
        )}
        {(block.block_type === 'text' || block.block_type !== 'heading' && block.block_type !== 'code') && (
          <textarea
            value={block.content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            className="block__textarea block__textarea--text"
            rows={4}
            placeholder="Text"
          />
        )}

        <div className="block__add-container">
          <button className="block__add-btn" onClick={() => setShowMenu(!showMenu)} disabled={isAdding}>
            <PlusIcon className="block__icon" />
          </button>
          <button className="block__delete-btn" onClick={() => onDeleteBlock?.(block.id)} disabled={isAdding}>
            <TrashIcon className="block__icon" />
          </button>
          {showMenu && (
            <div className="block__add-menu" ref={menuRef}>
              <div>
                <strong>Add Below:</strong>
                <button onClick={() => { onAddBlock?.(null, 'text'); setShowMenu(false); }} disabled={isAdding}>Text</button>
                <button onClick={() => { onAddBlock?.(null, 'heading'); setShowMenu(false); }} disabled={isAdding}>Heading</button>
                <button onClick={() => { onAddBlock?.(null, 'code'); setShowMenu(false); }} disabled={isAdding}>Code</button>
              </div>
              <div>
                <strong>Add Child:</strong>
                <button onClick={() => { onAddBlock?.(block.id, 'text'); setShowMenu(false); }} disabled={isAdding}>Text</button>
                <button onClick={() => { onAddBlock?.(block.id, 'heading'); setShowMenu(false); }} disabled={isAdding}>Heading</button>
                <button onClick={() => { onAddBlock?.(block.id, 'code'); setShowMenu(false); }} disabled={isAdding}>Code</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`block block--${block.block_type}`} style={{ marginLeft: `${(block.order_path?.length ?? 1) * 20 - 20}px` }}>
      {block.block_type === 'heading' && <h2>{block.content}</h2>}
      {block.block_type === 'code' && <pre><code>{block.content}</code></pre>}
      {block.block_type === 'text' && <p>{block.content}</p>}
      {block.block_type !== 'heading' && block.block_type !== 'code' && block.block_type !== 'text' && (
        <div>{block.content}</div>
      )}
    </div>
  );
};

export default Block;