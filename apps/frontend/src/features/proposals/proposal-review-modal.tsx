import type React from "react";
import { useEffect, useState } from "react";
import Button from "@/ui/button";
import type { Block } from "@/features/documents/types";
import { type Proposal, type ProposalBlockChange, proposalsApi } from "./proposals.api";
import "./proposal-review-modal.scss";

interface ProposalReviewModalProps {
	proposal: Proposal | null;
	documentBlocks: Block[];
	onClose: () => void;
	onAccepted: () => void;
	onRejected: () => void;
	onDeleted: () => void;
}

type DiffRow =
	| { kind: "create"; change: ProposalBlockChange }
	| { kind: "update"; change: ProposalBlockChange; before: Block }
	| { kind: "delete"; change: ProposalBlockChange; before: Block };

const BLOCK_TYPE_LABELS: Record<string, string> = {
	text: "Text",
	heading: "Heading",
	code: "Code",
};

const blockLabel = (type: string) => BLOCK_TYPE_LABELS[type] ?? type;

const ProposalReviewModal: React.FC<ProposalReviewModalProps> = ({
	proposal,
	documentBlocks,
	onClose,
	onAccepted,
	onRejected,
	onDeleted,
}) => {
	const [blockChanges, setBlockChanges] = useState<ProposalBlockChange[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [rejectMode, setRejectMode] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [reasonError, setReasonError] = useState("");

	useEffect(() => {
		if (!proposal) {
			setBlockChanges([]);
			setRejectMode(false);
			setRejectReason("");
			setReasonError("");
			return;
		}
		setLoading(true);
		setError(null);
		proposalsApi
			.getBlockChanges(proposal.id)
			.then(setBlockChanges)
			.catch(() => setError("Unable to load block changes."))
			.finally(() => setLoading(false));
	}, [proposal]);

	if (!proposal) return null;

	const diffs: DiffRow[] = blockChanges
		.map((change): DiffRow | null => {
			if (change.action === "create") {
				return { kind: "create", change };
			}
			const before = documentBlocks.find((b) => b.id === change.block_id);
			if (!before) return null;
			if (change.action === "update") return { kind: "update", change, before };
			if (change.action === "delete") return { kind: "delete", change, before };
			return null;
		})
		.filter((d): d is DiffRow => d !== null);

	const handleAccept = async () => {
		setSubmitting(true);
		try {
			await proposalsApi.accept(proposal.id);
			onAccepted();
		} catch {
			setError("Failed to accept proposal. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("Delete this proposal? This cannot be undone.")) return;
		setSubmitting(true);
		try {
			await proposalsApi.delete(proposal.id);
			onDeleted();
		} catch {
			setError("Failed to delete proposal. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleRejectConfirm = async () => {
		if (!rejectReason.trim()) {
			setReasonError("A reason is required to decline a proposal.");
			return;
		}
		setReasonError("");
		setSubmitting(true);
		try {
			await proposalsApi.reject(proposal.id, rejectReason.trim());
			onRejected();
		} catch {
			setError("Failed to decline proposal. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="proposal-review__overlay" onClick={onClose} role="dialog" aria-modal>
			<div
				className="proposal-review__modal"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="proposal-review__header">
					<div className="proposal-review__header-text">
						<h3 className="proposal-review__title">{proposal.title}</h3>
						<span className="proposal-review__state">{proposal.state}</span>
					</div>
					<button className="proposal-review__close" onClick={onClose} aria-label="Close">
						✕
					</button>
				</div>

				{/* Meta */}
				<div className="proposal-review__meta">
					{proposal.intent && (
						<div className="proposal-review__meta-row">
							<span className="proposal-review__meta-label">Intent</span>
							<span className="proposal-review__meta-value">{proposal.intent}</span>
						</div>
					)}
					{proposal.scope && (
						<div className="proposal-review__meta-row">
							<span className="proposal-review__meta-label">Scope</span>
							<span className="proposal-review__meta-value">{proposal.scope}</span>
						</div>
					)}
				</div>

				{/* Diff */}
				<div className="proposal-review__diff-section">
					<h4 className="proposal-review__diff-heading">Changes</h4>
					{loading ? (
						<p className="proposal-review__loading">Loading changes…</p>
					) : error ? (
						<p className="proposal-review__error">{error}</p>
					) : diffs.length === 0 ? (
						<p className="proposal-review__empty">No block changes recorded.</p>
					) : (
						<div className="proposal-review__diffs">
							{diffs.map((diff, i) => (
								<div key={i} className={`proposal-review__diff proposal-review__diff--${diff.kind}`}>
									<div className="proposal-review__diff-label">
										{diff.kind === "create" && (
											<span className="proposal-review__diff-tag proposal-review__diff-tag--add">
												+ New {blockLabel(diff.change.block_type)}
											</span>
										)}
										{diff.kind === "update" && (
											<span className="proposal-review__diff-tag proposal-review__diff-tag--change">
												~ Edit {blockLabel(diff.change.block_type)}
											</span>
										)}
										{diff.kind === "delete" && (
											<span className="proposal-review__diff-tag proposal-review__diff-tag--remove">
												− Remove {blockLabel(diff.before.block_type)}
											</span>
										)}
									</div>

									{diff.kind === "update" && (
										<div className="proposal-review__diff-panels">
											<div className="proposal-review__diff-panel proposal-review__diff-panel--before">
												<span className="proposal-review__diff-panel-label">Before</span>
												<pre className="proposal-review__diff-content">{diff.before.content}</pre>
											</div>
											<div className="proposal-review__diff-panel proposal-review__diff-panel--after">
												<span className="proposal-review__diff-panel-label">After</span>
												<pre className="proposal-review__diff-content">{diff.change.content}</pre>
											</div>
										</div>
									)}

									{diff.kind === "create" && (
										<pre className="proposal-review__diff-content proposal-review__diff-content--add">
											{diff.change.content}
										</pre>
									)}

									{diff.kind === "delete" && (
										<pre className="proposal-review__diff-content proposal-review__diff-content--remove">
											{diff.before.content}
										</pre>
									)}
								</div>
							))}
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="proposal-review__actions">
					{rejectMode ? (
						<div className="proposal-review__reject-form">
							<label className="proposal-review__reject-label" htmlFor="reject-reason">
								Reason for declining <span aria-hidden>*</span>
							</label>
							<textarea
								id="reject-reason"
								className="proposal-review__reject-textarea"
								placeholder="Explain why this proposal is being declined…"
								value={rejectReason}
								onChange={(e) => {
									setRejectReason(e.target.value);
									if (e.target.value.trim()) setReasonError("");
								}}
								rows={3}
							/>
							{reasonError && (
								<p className="proposal-review__reason-error">{reasonError}</p>
							)}
							<div className="proposal-review__reject-buttons">
								<Button
									variant="secondary"
									size="small"
									onClick={() => {
										setRejectMode(false);
										setRejectReason("");
										setReasonError("");
									}}
									isDisabled={submitting}
								>
									Back
								</Button>
								<Button
									variant="danger"
									size="small"
									onClick={handleRejectConfirm}
									isDisabled={submitting}
								>
									{submitting ? "Declining…" : "Confirm Decline"}
								</Button>
							</div>
						</div>
					) : (
						<div className="proposal-review__action-row">
							<Button
								variant="danger"
								size="small"
								onClick={handleDelete}
								isDisabled={submitting}
							>
								Delete
							</Button>
							<div className="proposal-review__action-primary">
								{proposal.state === "open" ? (
									<>
										<Button variant="secondary" size="small" onClick={onClose} isDisabled={submitting}>
											Cancel
										</Button>
										<Button
											variant="secondary"
											size="small"
											onClick={() => setRejectMode(true)}
											isDisabled={submitting}
										>
											Decline
										</Button>
										<Button
											variant="primary"
											size="small"
											onClick={handleAccept}
											isDisabled={submitting || loading}
										>
											{submitting ? "Accepting…" : "Accept"}
										</Button>
									</>
								) : (
									<Button variant="secondary" size="small" onClick={onClose} isDisabled={submitting}>
										Close
									</Button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProposalReviewModal;
