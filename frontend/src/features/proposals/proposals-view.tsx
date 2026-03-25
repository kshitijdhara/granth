import React, { useEffect, useState } from "react";
import { proposalsApi, type Proposal } from "./proposals.api";
import ProposalItem from "./proposal-item";
import "./proposals-view.scss";

interface ProposalsViewProps {
  documentId: string;
}

const ProposalsView: React.FC<ProposalsViewProps> = ({ documentId }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    proposalsApi.getForDocument(documentId)
      .then(setProposals)
      .catch(() => setError("Unable to load proposals."))
      .finally(() => setLoading(false));
  }, [documentId]);

  return (
    <div className="proposals-view">
      <div className="proposals-view__header">
        <h3 className="proposals-view__title">
          Proposals {proposals.length > 0 && `(${proposals.length})`}
        </h3>
      </div>
      <div className="proposals-view__body">
        {loading ? (
          <p className="proposals-view__loading">Loading…</p>
        ) : error ? (
          <p className="proposals-view__error">{error}</p>
        ) : proposals.length === 0 ? (
          <p className="proposals-view__empty">No proposals yet.</p>
        ) : (
          <ul className="proposals-view__list" role="list">
            {proposals.map((p) => <ProposalItem key={p.id} proposal={p} />)}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProposalsView;
