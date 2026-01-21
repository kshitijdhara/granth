import React, { useEffect, useState } from 'react';
import { proposalsAPI, type Proposal } from '../../services/proposalsApi';
import ProposalItem from './ProposalItem';
import './ProposalsView.scss';

interface ProposalsViewProps {
  documentId: string;
}

const ProposalsView: React.FC<ProposalsViewProps> = ({ documentId }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProposals = async () => {
      setLoading(true);
      setError(null);
      try {
        const props = await proposalsAPI.getProposalsForDocument(documentId);
        setProposals(props);
      } catch (err) {
        console.error('Failed to load proposals', err);
        setError('Unable to load proposals. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadProposals();
  }, [documentId]);

  if (loading) return (
    <div className="proposals-view">
      <div className="proposals-view__loading">Loading proposals...</div>
    </div>
  );

  if (error) return (
    <div className="proposals-view">
      <div className="proposals-view__error">{error}</div>
    </div>
  );

  return (
    <div className="proposals-view">
      <h3 className="proposals-view__title">Proposals</h3>
      {proposals.length === 0 ? (
        <div className="proposals-view__empty">No proposals yet.</div>
      ) : (
        <ul className="proposals-view__list">
          {proposals.map((proposal) => (
            <ProposalItem key={proposal.id} proposal={proposal} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProposalsView;