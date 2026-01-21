import React from 'react';
import type { Proposal } from '../../services/proposalsApi';
import './ProposalItem.scss';

interface ProposalItemProps {
  proposal: Proposal;
  onClick?: (proposal: Proposal) => void;
}

const ProposalItem: React.FC<ProposalItemProps> = ({ proposal, onClick }) => {
  const handleClick = () => {
    alert(`Proposal: ${proposal.title}\nState: ${proposal.state}\nIntent: ${proposal.intent}`);
    if (onClick) {
      onClick(proposal);
    }
  };

  return (
    <li className="proposal-item" onClick={handleClick}>
      <div className="proposal-item__title">{proposal.title}</div>
      <div className="proposal-item__meta">
        <span className="proposal-item__state">{proposal.state}</span>
        <span className="proposal-item__date">
          {new Date(proposal.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>
      <p className="proposal-item__intent">{proposal.intent}</p>
    </li>
  );
};

export default ProposalItem;