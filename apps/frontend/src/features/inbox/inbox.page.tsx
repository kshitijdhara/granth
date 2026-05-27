import {
	CheckCircleIcon,
	ExclamationTriangleIcon,
	SparklesIcon,
	XCircleIcon,
} from "@heroicons/react/24/solid";
import gsap from "gsap";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Badge from "@/ui/badge";
import Card from "@/ui/card";
import EmptyState from "@/ui/empty-state";
import { useAuth } from "@/features/auth/auth.context";
import { documentsApi } from "@/features/documents/documents.api";
import type { Document } from "@/features/documents/types";
import type { Notification } from "@/features/notifications/notifications.api";
import { notificationLabel, notificationsApi } from "@/features/notifications/notifications.api";
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

const InboxPage: React.FC = () => {
	const navigate = useNavigate();
	const { userId } = useAuth();
	const { current: currentWorkspace } = useWorkspace();
	const [loading, setLoading] = useState(true);
	const [allProposals, setAllProposals] = useState<ProposalWithDoc[]>([]);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [markingAllRead, setMarkingAllRead] = useState(false);
	const cardsRef = useRef<HTMLDivElement>(null);

	// Load proposals
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

			// Conflict detection
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

	// Fetch notifications
	useEffect(() => {
		notificationsApi.list().then(setNotifications).catch(() => {});
	}, []);

	// Animate cards on mount
	useEffect(() => {
		if (cardsRef.current) {
			const cards = cardsRef.current.querySelectorAll(".inbox__card");
			gsap.from(cards, {
				opacity: 0,
				y: 12,
				stagger: 0.04,
				duration: 0.4,
				ease: "power2.out",
			});
		}
	}, [loading, allProposals.length]);

	const handleMarkAllRead = async () => {
		setMarkingAllRead(true);
		try {
			await notificationsApi.markAllRead();
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		} finally {
			setMarkingAllRead(false);
		}
	};

	const handleNotificationClick = async (notificationId: string, proposalId?: string) => {
		try {
			await notificationsApi.markRead(notificationId);
			setNotifications((prev) =>
				prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
			);
		} finally {
			if (proposalId) navigate(`/proposals/${proposalId}`);
		}
	};

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
				{/* Header */}
				<header className="inbox__header">
					<div>
						<h1 className="inbox__title">Inbox</h1>
						{!loading && (
							<p className="inbox__subtitle">
								{totalWaiting > 0 ? (
									<>
										<strong>{totalWaiting}</strong> {totalWaiting === 1 ? "proposal" : "proposals"} waiting
										{totalInReview > 0 && <> · <strong>{totalInReview}</strong> in review</>}
									</>
								) : totalInReview > 0 ? (
									<><strong>{totalInReview}</strong> proposal{totalInReview === 1 ? "" : "s"} in review</>
								) : (
									"You're all caught up."
								)}
							</p>
						)}
					</div>
				</header>

				{loading ? (
					<div className="inbox__loading">
						<div className="inbox__skeleton" />
						<div className="inbox__skeleton" />
						<div className="inbox__skeleton inbox__skeleton--short" />
					</div>
				) : (
					<div className="inbox__sections" ref={cardsRef}>
						{/* Notifications */}
						{notifications.length > 0 && (
							<section className="inbox__section">
								<div className="inbox__section-header">
									<h2 className="inbox__section-title">Recent Activity</h2>
									{notifications.some((n) => !n.read) && (
										<button
											type="button"
											className="inbox__pill-button"
											onClick={handleMarkAllRead}
											disabled={markingAllRead}
										>
											{markingAllRead ? "Marking…" : "Mark all read"}
										</button>
									)}
								</div>
								<div className="inbox__cards">
									{notifications.slice(0, 5).map((n) => (
										<Card
											key={n.id}
											variant="glass"
											padding="md"
											onClick={() => handleNotificationClick(n.id, n.payload.proposal_id)}
											className="inbox__card"
										>
											<div className="inbox__notification-row">
												{!n.read && <span className="inbox__unread-dot" />}
												<div className="inbox__notification-content">
													<p className="inbox__notification-text">{notificationLabel(n)}</p>
													<span className="inbox__notification-time">{relativeTime(n.created_at)}</span>
												</div>
											</div>
										</Card>
									))}
								</div>
							</section>
						)}

						{/* Needs Decision */}
						{needsDecision.length > 0 && (
							<section className="inbox__section">
								<h2 className="inbox__section-title">Needs Your Decision</h2>
								<div className="inbox__cards">
									{needsDecision.map(({ proposal, document, hasConflict }) => (
										<Card
											key={proposal.id}
											variant="glass"
											padding="md"
											onClick={() => navigate(`/proposals/${proposal.id}`)}
											className="inbox__card inbox__card--proposal"
										>
											<div className="inbox__proposal-header">
												<Badge variant="open" size="small">
													Open
												</Badge>
												{hasConflict && (
													<Badge variant="conflict" size="small">
														<ExclamationTriangleIcon width={12} height={12} style={{ marginRight: 4 }} />
														Conflict
													</Badge>
												)}
											</div>
											<div className="inbox__proposal-content">
												<h3 className="inbox__proposal-title">
													{proposal.title || "Untitled proposal"}
												</h3>
												{proposal.intent && (
													<p className="inbox__proposal-intent">{proposal.intent}</p>
												)}
												<div className="inbox__proposal-meta">
													<span>{document.title || "Untitled"}</span>
													<span className="inbox__meta-dot">·</span>
													<span>{relativeTime(proposal.created_at)}</span>
												</div>
											</div>
										</Card>
									))}
								</div>
							</section>
						)}

						{/* Awaiting Review */}
						{mineInReview.length > 0 && (
							<section className="inbox__section">
								<h2 className="inbox__section-title">Awaiting Review</h2>
								<div className="inbox__cards">
									{mineInReview.map(({ proposal, document, hasConflict }) => (
										<Card
											key={proposal.id}
											variant="glass"
											padding="md"
											onClick={() => navigate(`/proposals/${proposal.id}`)}
											className="inbox__card inbox__card--proposal"
										>
											<div className="inbox__proposal-header">
												<Badge variant="open" size="small">
													Pending Review
												</Badge>
												{hasConflict && (
													<Badge variant="conflict" size="small">
														<ExclamationTriangleIcon width={12} height={12} style={{ marginRight: 4 }} />
														Conflict
													</Badge>
												)}
											</div>
											<div className="inbox__proposal-content">
												<h3 className="inbox__proposal-title">
													{proposal.title || "Untitled proposal"}
												</h3>
												{proposal.intent && (
													<p className="inbox__proposal-intent">{proposal.intent}</p>
												)}
												<div className="inbox__proposal-meta">
													<span>{document.title || "Untitled"}</span>
													<span className="inbox__meta-dot">·</span>
													<span>{relativeTime(proposal.created_at)}</span>
												</div>
											</div>
										</Card>
									))}
								</div>
							</section>
						)}

						{/* Empty State */}
						{needsDecision.length === 0 && mineInReview.length === 0 && (
							<div className="inbox__empty-wrapper">
								<EmptyState
									icon={<SparklesIcon width={32} height={32} />}
									heading="You're all caught up"
									description="No open proposals right now. Browse the Library and propose a change."
									cta={{
										label: "Browse Library",
										onClick: () => navigate("/truth"),
									}}
								/>
							</div>
						)}

						{/* Recently Decided */}
						{recentlyDecided.length > 0 && (
							<section className="inbox__section">
								<h2 className="inbox__section-title">Recently Decided</h2>
								<div className="inbox__cards">
									{recentlyDecided.map(({ proposal, document }) => (
										<Card
											key={proposal.id}
											variant="glass"
											padding="md"
											onClick={() => navigate(`/proposals/${proposal.id}`)}
											className="inbox__card inbox__card--decided"
										>
											<div className="inbox__decided-header">
												{proposal.state === "accepted" ? (
													<>
														<CheckCircleIcon width={20} height={20} className="inbox__icon-accepted" />
														<Badge variant="accepted" size="small">
															Accepted
														</Badge>
													</>
												) : (
													<>
														<XCircleIcon width={20} height={20} className="inbox__icon-declined" />
														<Badge variant="declined" size="small">
															Declined
														</Badge>
													</>
												)}
											</div>
											<div className="inbox__proposal-content">
												<h3 className="inbox__proposal-title">
													{proposal.title || "Untitled proposal"}
												</h3>
												{proposal.rejection_reason && (
													<p className="inbox__rejection-reason">"{proposal.rejection_reason}"</p>
												)}
												<div className="inbox__proposal-meta">
													<span>{document.title || "Untitled"}</span>
													<span className="inbox__meta-dot">·</span>
													<span>{relativeTime(proposal.updated_at)}</span>
												</div>
											</div>
										</Card>
									))}
								</div>
							</section>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default InboxPage;
