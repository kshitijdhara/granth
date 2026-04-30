import {
	ArrowLeftIcon,
	ArrowsRightLeftIcon,
	CheckCircleIcon,
	ExclamationTriangleIcon,
	XCircleIcon,
} from "@heroicons/react/24/solid";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/features/auth/auth.context";
import { documentsApi } from "@/features/documents/documents.api";
import type { Document } from "@/features/documents/types";
import type { Proposal, ProposalBlockChange } from "@/features/proposals/proposals.api";
import { proposalsApi } from "@/features/proposals/proposals.api";
import type { WorkspaceMember } from "@/features/workspaces/types";
import { useWorkspace } from "@/features/workspaces/workspace.context";
import { workspacesApi } from "@/features/workspaces/workspaces.api";
import Button from "@/ui/button";
import "./decision-room.page.scss";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRelative = (iso: string): string => {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 60) return `${Math.max(1, mins)}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	return `${days}d ago`;
};

const semanticLabel = (action: string, blockType: string): string => {
	const typeLabel =
		blockType === "heading" ? "heading" : blockType === "code" ? "code block" : "claim";
	switch (action) {
		case "create":
			return `Adds new ${typeLabel}`;
		case "delete":
			return `Removes ${typeLabel}`;
		case "update":
			return `Modifies existing ${typeLabel}`;
		default:
			return action;
	}
};

interface ConflictingProposal {
	proposal: Proposal;
	document: Document;
}

// ─── Semantic diff block ──────────────────────────────────────────────────────

interface SemanticDiffEntryProps {
	change: ProposalBlockChange;
	showTextDiff: boolean;
}

const SemanticDiffEntry: React.FC<SemanticDiffEntryProps> = ({ change, showTextDiff }) => {
	const label = semanticLabel(change.action, change.block_type);

	return (
		<div className={`semantic-diff-entry semantic-diff-entry--${change.action}`}>
			<div className="semantic-diff-entry__label">
				<span
					className={`semantic-diff-entry__action-glyph semantic-diff-entry__action-glyph--${change.action}`}
				>
					{change.action === "create" ? "+" : change.action === "delete" ? "−" : "~"}
				</span>
				{label}
			</div>
			{showTextDiff && change.content && (
				<div className="semantic-diff-entry__text">
					<pre className="semantic-diff-entry__pre">{change.content}</pre>
				</div>
			)}
		</div>
	);
};

// ─── Decision room page ───────────────────────────────────────────────────────

const DecisionRoomPage: React.FC = () => {
	const { id: proposalId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { userId } = useAuth();
	const { current: currentWorkspace } = useWorkspace();

	const [proposal, setProposal] = useState<Proposal | null>(null);
	const [document, setDocument] = useState<Document | null>(null);
	const [changes, setChanges] = useState<ProposalBlockChange[]>([]);
	const [conflicts, setConflicts] = useState<ConflictingProposal[]>([]);
	const [members, setMembers] = useState<WorkspaceMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [showTextDiff, setShowTextDiff] = useState(false);

	// Decision state
	const [acting, setActing] = useState<"accept" | "decline" | null>(null);
	const [declineReason, setDeclineReason] = useState("");
	const [declineStep, setDeclineStep] = useState<"confirm" | "reason">("confirm");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!proposalId) return;
		setLoading(true);

		proposalsApi
			.get(proposalId)
			.then(async (p) => {
				setProposal(p);

				const membersFetch = currentWorkspace
					? workspacesApi.getMembers(currentWorkspace.id).catch(() => [] as WorkspaceMember[])
					: Promise.resolve([] as WorkspaceMember[]);

				const [doc, blockChanges, allProposals, fetchedMembers] = await Promise.all([
					documentsApi.get(p.document_id),
					proposalsApi.getBlockChanges(proposalId),
					proposalsApi.getForDocument(p.document_id),
					membersFetch,
				]);
				setDocument(doc);
				setChanges(blockChanges);
				setMembers(fetchedMembers);

				// Detect conflicts with other open proposals
				const openOthers = allProposals.filter((op) => op.id !== proposalId && op.state === "open");
				const myBlockIds = new Set(p.affected_block_ids);
				const conflicting = openOthers.filter((op) =>
					op.affected_block_ids.some((id) => myBlockIds.has(id))
				);
				const conflictWithDocs = await Promise.all(
					conflicting.map(async (cp) => ({
						proposal: cp,
						document: doc,
					}))
				);
				setConflicts(conflictWithDocs);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [proposalId, currentWorkspace]);

	const handleAccept = async () => {
		if (!proposalId) return;
		setSubmitting(true);
		setError(null);
		try {
			await proposalsApi.accept(proposalId);
			setProposal((prev) => (prev ? { ...prev, state: "accepted" } : prev));
			setActing(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to accept proposal");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDecline = async () => {
		if (!proposalId || !declineReason.trim()) return;
		setSubmitting(true);
		setError(null);
		try {
			await proposalsApi.reject(proposalId, declineReason.trim());
			setProposal((prev) =>
				prev ? { ...prev, state: "rejected", rejection_reason: declineReason.trim() } : prev
			);
			setActing(null);
			setDeclineStep("confirm");
			setDeclineReason("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to decline proposal");
		} finally {
			setSubmitting(false);
		}
	};

	const isAuthor = proposal?.author_id === userId;
	const isOpen = proposal?.state === "open";

	// True when no other workspace member can review (solo workspace or all others are contributors).
	// In this case the author is the only person who can adopt their own proposal — allow it.
	const hasOtherReviewers = members.some(
		(m) => m.user_id !== userId && (m.role === "admin" || m.role === "reviewer")
	);
	const canSelfReview = isAuthor && !hasOtherReviewers;

	if (loading) {
		return (
			<div className="decision-room decision-room--loading">
				<div className="decision-room__loading-inner">
					<div className="decision-room__skeleton decision-room__skeleton--title" />
					<div className="decision-room__skeleton" />
					<div className="decision-room__skeleton decision-room__skeleton--short" />
				</div>
			</div>
		);
	}

	if (!proposal) {
		return (
			<div className="decision-room decision-room--error">
				<p>Proposal not found.</p>
				<Button variant="secondary" size="small" onClick={() => navigate("/inbox")}>
					Back to Inbox
				</Button>
			</div>
		);
	}

	return (
		<div className="decision-room">
			{/* Chrome */}
			<div className="decision-room__chrome">
				<button type="button" className="decision-room__back" onClick={() => navigate("/inbox")}>
					<ArrowLeftIcon className="decision-room__back-icon" />
					Inbox
				</button>
				<div className="decision-room__chrome-meta">
					<span
						className={`decision-room__state-pill decision-room__state-pill--${proposal.state}`}
					>
						{proposal.state === "open"
							? "Open"
							: proposal.state === "accepted"
								? "Accepted"
								: "Considered & Declined"}
					</span>
					{document && (
						<button
							type="button"
							className="decision-room__doc-link"
							onClick={() => navigate(`/truth/${document.id}`)}
						>
							in {document.title || "Untitled body"}
						</button>
					)}
				</div>
			</div>

			<div className="decision-room__layout">
				{/* Main column */}
				<div className="decision-room__main">
					<header className="decision-room__header">
						<h1 className="decision-room__title">{proposal.title || "Untitled proposal"}</h1>
						<p className="decision-room__byline">Proposed {formatRelative(proposal.created_at)}</p>
					</header>

					{/* THE CHANGE — semantic first */}
					<section className="decision-room__section">
						<div className="decision-room__section-header">
							<h2 className="decision-room__section-title">The change</h2>
							<button
								type="button"
								className="decision-room__text-diff-toggle"
								onClick={() => setShowTextDiff((v) => !v)}
							>
								{showTextDiff ? "hide text diff" : "› show text diff"}
							</button>
						</div>

						{changes.length === 0 ? (
							<p className="decision-room__empty-section">No block changes recorded.</p>
						) : (
							<div className="decision-room__diff-list">
								{changes.map((c) => (
									<SemanticDiffEntry key={c.id} change={c} showTextDiff={showTextDiff} />
								))}
							</div>
						)}
					</section>

					{/* THE REASONING */}
					<section className="decision-room__section">
						<h2 className="decision-room__section-title">The reasoning</h2>
						{proposal.intent ? (
							<blockquote className="decision-room__reasoning-quote">{proposal.intent}</blockquote>
						) : (
							<p className="decision-room__empty-section decision-room__empty-section--warning">
								No reasoning was provided for this proposal.
							</p>
						)}
						{proposal.scope && (
							<p className="decision-room__scope">
								<strong>Scope:</strong> {proposal.scope}
							</p>
						)}
					</section>

					{/* CONFLICTS */}
					{conflicts.length > 0 && (
						<section className="decision-room__section decision-room__section--conflict">
							<div className="decision-room__section-header">
								<ExclamationTriangleIcon className="decision-room__conflict-icon" />
								<h2 className="decision-room__section-title decision-room__section-title--conflict">
									Conflict
								</h2>
							</div>
							<p className="decision-room__conflict-explanation">
								This proposal touches the same claims as{" "}
								{conflicts.length === 1
									? "another open proposal"
									: `${conflicts.length} other open proposals`}
								. The group must pick one, combine, or supersede.
							</p>
							<div className="decision-room__conflict-list">
								{conflicts.map(({ proposal: cp }) => (
									<button
										type="button"
										key={cp.id}
										className="decision-room__conflict-row"
										onClick={() => navigate(`/proposals/${cp.id}`)}
									>
										<span className="decision-room__conflict-title">
											{cp.title || "Untitled proposal"}
										</span>
										<span className="decision-room__conflict-cta">
											<ArrowsRightLeftIcon className="decision-room__conflict-cta-icon" />
											open side-by-side
										</span>
									</button>
								))}
							</div>
						</section>
					)}

					{/* DECISION OUTCOME — when already decided */}
					{!isOpen && (
						<section
							className={`decision-room__section decision-room__outcome decision-room__outcome--${proposal.state}`}
						>
							<div className="decision-room__outcome-header">
								{proposal.state === "accepted" ? (
									<CheckCircleIcon className="decision-room__outcome-icon decision-room__outcome-icon--accepted" />
								) : (
									<XCircleIcon className="decision-room__outcome-icon decision-room__outcome-icon--declined" />
								)}
								<h2 className="decision-room__outcome-title">
									{proposal.state === "accepted"
										? "Adopted — now part of shared truth"
										: "Considered & Declined"}
								</h2>
							</div>
							{proposal.rejection_reason && (
								<blockquote className="decision-room__outcome-reason">
									"{proposal.rejection_reason}"
								</blockquote>
							)}
						</section>
					)}
				</div>

				{/* Side panel — decision controls */}
				{isOpen && (
					<aside className="decision-room__side">
						<div className="decision-room__side-inner">
							<h3 className="decision-room__side-heading">Your decision</h3>

							{isAuthor && !canSelfReview && (
								<div className="decision-room__author-note">
									You authored this proposal. Another member of the group must accept or decline it.
								</div>
							)}

							{canSelfReview && (
								<div className="decision-room__solo-note">
									You're the only reviewer in this group. You can adopt or decline your own proposal.
								</div>
							)}

							{(!isAuthor || canSelfReview) && (
								<>
									{error && <div className="decision-room__error">{error}</div>}

									{acting === null && (
										<div className="decision-room__actions">
											<button
												type="button"
												className="decision-room__action-btn decision-room__action-btn--accept"
												onClick={() => setActing("accept")}
											>
												<CheckCircleIcon className="decision-room__action-icon" />
												Accept
											</button>
											<button
												type="button"
												className="decision-room__action-btn decision-room__action-btn--decline"
												onClick={() => {
													setActing("decline");
													setDeclineStep("reason");
												}}
											>
												<XCircleIcon className="decision-room__action-icon" />
												Decline
											</button>
											{conflicts.length > 0 && (
												<button
													type="button"
													className="decision-room__action-btn decision-room__action-btn--combine"
													onClick={() => navigate(`/proposals/${conflicts[0]?.proposal.id}`)}
												>
													<ArrowsRightLeftIcon className="decision-room__action-icon" />
													Combine with conflict
												</button>
											)}
										</div>
									)}

									{acting === "accept" && (
										<div className="decision-room__confirm-accept">
											<p className="decision-room__confirm-text">
												You are about to make this part of group truth. The reasoning above will be
												permanently preserved alongside this decision.
											</p>
											<div className="decision-room__confirm-actions">
												<button
													type="button"
													className="decision-room__action-btn decision-room__action-btn--accept"
													onClick={handleAccept}
													disabled={submitting}
												>
													<CheckCircleIcon className="decision-room__action-icon" />
													{submitting ? "Adopting…" : "Confirm & Adopt"}
												</button>
												<button
													type="button"
													className="decision-room__action-btn decision-room__action-btn--cancel"
													onClick={() => setActing(null)}
												>
													Cancel
												</button>
											</div>
										</div>
									)}

									{acting === "decline" && declineStep === "reason" && (
										<div className="decision-room__decline-form">
											<label htmlFor="decline-reason" className="decision-room__decline-label">
												A reason is required to decline. It becomes part of the permanent record.
											</label>
											<textarea
												id="decline-reason"
												className="decision-room__decline-textarea"
												value={declineReason}
												placeholder="Explain why this proposal is being declined…"
												onChange={(e) => setDeclineReason(e.target.value)}
												rows={4}
											/>
											<div className="decision-room__confirm-actions">
												<button
													type="button"
													className="decision-room__action-btn decision-room__action-btn--decline"
													onClick={handleDecline}
													disabled={!declineReason.trim() || submitting}
												>
													<XCircleIcon className="decision-room__action-icon" />
													{submitting ? "Declining…" : "Confirm Decline"}
												</button>
												<button
													type="button"
													className="decision-room__action-btn decision-room__action-btn--cancel"
													onClick={() => {
														setActing(null);
														setDeclineStep("confirm");
														setDeclineReason("");
													}}
												>
													Back
												</button>
											</div>
										</div>
									)}
								</>
							)}

							<div className="decision-room__litmus">
								<p className="decision-room__litmus-heading">Before you decide, ask:</p>
								<ul className="decision-room__litmus-list">
									<li>Does this make change safer?</li>
									<li>Does it preserve reasoning?</li>
									<li>Does it reinforce proposal over edit?</li>
								</ul>
							</div>
						</div>
					</aside>
				)}
			</div>
		</div>
	);
};

export default DecisionRoomPage;
