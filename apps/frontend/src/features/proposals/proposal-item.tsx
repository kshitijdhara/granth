import type React from "react";
import Card from "@/ui/card";
import type { Proposal } from "./proposals.api";
import "./proposal-item.scss";

interface ProposalItemProps {
	proposal: Proposal;
	onClick?: (proposal: Proposal) => void;
}

const STATE_LABELS: Record<string, string> = {
	open: "Open",
	accepted: "Accepted",
	rejected: "Considered & Declined",
};

const ProposalItem: React.FC<ProposalItemProps> = ({ proposal, onClick }) => {
	const isRejected = proposal.state === "rejected";
	const isAccepted = proposal.state === "accepted";

	return (
		<Card
			variant="default"
			padding="md"
			onClick={isRejected || isAccepted ? undefined : () => onClick?.(proposal)}
			className={[
				"proposal-item",
				isRejected ? "proposal-item--rejected" : "",
				isAccepted ? "proposal-item--accepted" : "",
			]
				.filter(Boolean)
				.join(" ")}
		>
			<div className="proposal-item__title">{proposal.title}</div>
			<div className="proposal-item__meta">
				<span className={`proposal-item__state proposal-item__state--${proposal.state}`}>
					{STATE_LABELS[proposal.state] ?? proposal.state}
				</span>
				<span className="proposal-item__date">
					{new Date(proposal.created_at).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					})}
				</span>
			</div>
			<p className="proposal-item__intent">{proposal.intent}</p>
			{isRejected && proposal.rejection_reason && (
				<p className="proposal-item__rejection-reason">
					<span className="proposal-item__rejection-label">Reason: </span>
					{proposal.rejection_reason}
				</p>
			)}
		</Card>
	);
};

export default ProposalItem;
