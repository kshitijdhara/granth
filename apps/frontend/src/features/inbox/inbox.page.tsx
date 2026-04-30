import {
	CheckCircleIcon,
	ExclamationTriangleIcon,
	SparklesIcon,
	XCircleIcon,
} from "@heroicons/react/24/solid";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth.context";
import { documentsApi } from "@/features/documents/documents.api";
import type { Document } from "@/features/documents/types";
import type { Proposal } from "@/features/proposals/proposals.api";
import { proposalsApi } from "@/features/proposals/proposals.api";
import { useWorkspace } from "@/features/workspaces/workspace.context";
import { workspacesApi } from "@/features/workspaces/workspaces.api";
import "./inbox.page.scss";

interface ProposalWithDoc {
	proposal: Proposal;
	document: Document;
	hasConflict: boolean;
}

const relativeTime = (iso: string): string => {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 60) return `${Math.max(1, mins)}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const StateTag: React.FC<{ state: string }> = ({ state }) => {
	const labels: Record<string, string> = {
		open: "Open",
		accepted: "Accepted",
		rejected: "Considered & Declined",
	};

	return (
		<span className={`inbox__state-tag inbox__state-tag--${state}`}>{labels[state] ?? state}</span>
	);
};

const InboxPage: React.FC = () => {
	const navigate = useNavigate();
	const { userId } = useAuth();
	const { current: currentWorkspace } = useWorkspace();
	const [loading, setLoading] = useState(true);
	const [allProposals, setAllProposals] = useState<ProposalWithDoc[]>([]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		const load = async () => {
			const docs = await (currentWorkspace
				? workspacesApi.getDocuments(currentWorkspace.id)
				: documentsApi.getAll());

			const results = await Promise.allSettled(
				docs.map((doc) =>
					proposalsApi.getForDocument(doc.id).then((proposals) => ({ doc, proposals }))
				)
			);

			if (cancelled) return;

			const flat: Array<{ proposal: Proposal; document: Document }> = [];
			for (const r of results) {
				if (r.status === "fulfilled") {
					for (const p of r.value.proposals) {
						flat.push({ proposal: p, document: r.value.doc });
					}
				}
			}

			// Detect conflicts: open proposals sharing affected_block_ids
			const openProposals = flat.filter((p) => p.proposal.state === "open");
			const blockToProposals = new Map<string, string[]>();
			for (const { proposal } of openProposals) {
				for (const blockId of proposal.affected_block_ids) {
					const existing = blockToProposals.get(blockId) ?? [];
					existing.push(proposal.id);
					blockToProposals.set(blockId, existing);
				}
			}
			const conflictingIds = new Set<string>();
			for (const [, pIds] of blockToProposals) {
				if (pIds.length > 1) {
					for (const id of pIds) conflictingIds.add(id);
				}
			}

			const enriched: ProposalWithDoc[] = flat.map(({ proposal, document }) => ({
				proposal,
				document,
				hasConflict: conflictingIds.has(proposal.id),
			}));

			setAllProposals(enriched);
			setLoading(false);
		};

		load().catch(() => setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [currentWorkspace]);

	const { needsDecision, mineInReview, recentlyDecided } = useMemo(() => {
		const open = allProposals.filter((p) => p.proposal.state === "open");
		const decided = allProposals
			.filter((p) => p.proposal.state !== "open")
			.sort(
				(a, b) =>
					new Date(b.proposal.updated_at).getTime() - new Date(a.proposal.updated_at).getTime()
			)
			.slice(0, 8);

		return {
			needsDecision: open.filter((p) => p.proposal.author_id !== userId),
			mineInReview: open.filter((p) => p.proposal.author_id === userId),
			recentlyDecided: decided,
		};
	}, [allProposals, userId]);

	const totalWaiting = needsDecision.length;
	const totalInReview = mineInReview.length;

	return (
		<div className="inbox">
			<div className="inbox__container">
				<header className="inbox__header">
					<h1 className="inbox__title">Inbox</h1>
					{!loading && (
						<p className="inbox__summary">
							{totalWaiting > 0 ? (
								<>
									<strong>{totalWaiting}</strong> {totalWaiting === 1 ? "proposal" : "proposals"}{" "}
									waiting on you
									{totalInReview > 0 && (
										<>
											{" · "}
											<strong>{totalInReview}</strong> you authored{" "}
											{totalInReview === 1 ? "is" : "are"} in review
										</>
									)}
								</>
							) : totalInReview > 0 ? (
								<>
									<strong>{totalInReview}</strong> of your proposals{" "}
									{totalInReview === 1 ? "is" : "are"} in review
								</>
							) : (
								"You're all caught up."
							)}
						</p>
					)}
				</header>

				{loading ? (
					<div className="inbox__loading">
						<div className="inbox__skeleton" />
						<div className="inbox__skeleton inbox__skeleton--short" />
						<div className="inbox__skeleton" />
						<div className="inbox__skeleton inbox__skeleton--short" />
					</div>
				) : (
					<div className="inbox__sections">
						{needsDecision.length > 0 && (
							<section className="inbox__section">
								<h2 className="inbox__section-heading">Needs your decision</h2>
								<ul className="inbox__list">
									{needsDecision.map(({ proposal, document, hasConflict }) => (
										<li key={proposal.id}>
											<button
												type="button"
												className="inbox__row inbox__row--needs-action"
												onClick={() => navigate(`/proposals/${proposal.id}`)}
											>
												<div className="inbox__row-main">
													<div className="inbox__row-title">
														{proposal.title || "Untitled proposal"}
													</div>
													<div className="inbox__row-meta">
														<span className="inbox__row-body">
															in {document.title || "Untitled body"}
														</span>
														<span className="inbox__row-dot">·</span>
														<span className="inbox__row-time">
															{relativeTime(proposal.created_at)}
														</span>
													</div>
													{proposal.intent && (
														<div className="inbox__row-intent">{proposal.intent}</div>
													)}
												</div>
												<div className="inbox__row-side">
													<StateTag state={proposal.state} />
													{hasConflict && (
														<span
															className="inbox__conflict-flag"
															title="Conflicts with another open proposal"
														>
															<ExclamationTriangleIcon className="inbox__conflict-icon" />
															conflict
														</span>
													)}
												</div>
											</button>
										</li>
									))}
								</ul>
							</section>
						)}

						{mineInReview.length > 0 && (
							<section className="inbox__section">
								<h2 className="inbox__section-heading">Yours, in review</h2>
								<ul className="inbox__list">
									{mineInReview.map(({ proposal, document, hasConflict }) => (
										<li key={proposal.id}>
											<button
												type="button"
												className="inbox__row inbox__row--mine"
												onClick={() => navigate(`/proposals/${proposal.id}`)}
											>
												<div className="inbox__row-main">
													<div className="inbox__row-title">
														{proposal.title || "Untitled proposal"}
													</div>
													<div className="inbox__row-meta">
														<span className="inbox__row-body">
															in {document.title || "Untitled body"}
														</span>
														<span className="inbox__row-dot">·</span>
														<span className="inbox__row-time">
															{relativeTime(proposal.created_at)}
														</span>
													</div>
													{proposal.intent && (
														<div className="inbox__row-intent">{proposal.intent}</div>
													)}
												</div>
												<div className="inbox__row-side">
													<StateTag state={proposal.state} />
													{hasConflict && (
														<span
															className="inbox__conflict-flag"
															title="Conflicts with another open proposal"
														>
															<ExclamationTriangleIcon className="inbox__conflict-icon" />
															conflict
														</span>
													)}
												</div>
											</button>
										</li>
									))}
								</ul>
							</section>
						)}

						{needsDecision.length === 0 && mineInReview.length === 0 && (
							<div className="inbox__empty">
								<SparklesIcon className="inbox__empty-icon" />
								<p className="inbox__empty-heading">Nothing pending</p>
								<p className="inbox__empty-text">
									No open proposals in your workspace right now.{" "}
									<button
										type="button"
										className="inbox__empty-link"
										onClick={() => navigate("/truth")}
									>
										Explore the current truth
									</button>{" "}
									and propose a change.
								</p>
							</div>
						)}

						{recentlyDecided.length > 0 && (
							<section className="inbox__section inbox__section--decided">
								<h2 className="inbox__section-heading inbox__section-heading--muted">
									Recently decided
								</h2>
								<ul className="inbox__list">
									{recentlyDecided.map(({ proposal, document }) => (
										<li key={proposal.id}>
											<button
												type="button"
												className="inbox__row inbox__row--decided"
												onClick={() => navigate(`/proposals/${proposal.id}`)}
											>
												<div className="inbox__row-icon">
													{proposal.state === "accepted" ? (
														<CheckCircleIcon className="inbox__decided-icon inbox__decided-icon--accepted" />
													) : (
														<XCircleIcon className="inbox__decided-icon inbox__decided-icon--declined" />
													)}
												</div>
												<div className="inbox__row-main">
													<div className="inbox__row-title inbox__row-title--muted">
														{proposal.state === "accepted"
															? "Adopted: "
															: "Considered & declined: "}
														{proposal.title || "Untitled proposal"}
													</div>
													<div className="inbox__row-meta">
														<span className="inbox__row-body">
															in {document.title || "Untitled body"}
														</span>
														<span className="inbox__row-dot">·</span>
														<span className="inbox__row-time">
															{relativeTime(proposal.updated_at)}
														</span>
													</div>
													{proposal.rejection_reason && (
														<div className="inbox__row-reason">"{proposal.rejection_reason}"</div>
													)}
												</div>
											</button>
										</li>
									))}
								</ul>
							</section>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default InboxPage;
