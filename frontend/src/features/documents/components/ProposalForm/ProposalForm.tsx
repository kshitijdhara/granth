import React, { useState } from 'react';
import Button from '../../../../shared/components/Button/Button';
import './ProposalForm.scss';

interface ProposalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; intent: string; scope: string }) => void;
  isSubmitting: boolean;
}

const ProposalForm: React.FC<ProposalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [title, setTitle] = useState('');
  const [intent, setIntent] = useState('');
  const [scope, setScope] = useState('');

  const handleSubmit = () => {
    onSubmit({ title, intent, scope });
    setTitle('');
    setIntent('');
    setScope('');
  };

  if (!isOpen) return null;

  return (
    <div className="proposal-form__overlay">
      <div className="proposal-form__modal">
        <h3>Create Proposal</h3>
        <div className="proposal-form__field">
          <label htmlFor="proposal-title">Title</label>
          <input
            id="proposal-title"
            type="text"
            placeholder="Give your proposal a clear title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="proposal-form__field">
          <label htmlFor="proposal-intent">Intent</label>
          <textarea
            id="proposal-intent"
            placeholder="Explain why this change is needed"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
          />
        </div>
        <div className="proposal-form__field">
          <label htmlFor="proposal-scope">Scope</label>
          <textarea
            id="proposal-scope"
            placeholder="Describe what parts of the document are affected"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
        </div>
        <div className="proposal-form__actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isDisabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Proposal'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProposalForm;