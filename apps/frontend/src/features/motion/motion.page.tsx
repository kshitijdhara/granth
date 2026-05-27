import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import gsap from "gsap";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentsApi } from "@/features/documents/documents.api";
import type { Document } from "@/features/documents/types";
import type { Proposal } from "@/features/proposals/proposals.api";
import { proposalsApi } from "@/features/proposals/proposals.api";
import { useWorkspace } from "@/features/workspaces/workspace.context";
import { workspacesApi } from "@/features/workspaces/workspaces.api";
import Badge from "@/ui/badge";
import Card from "@/ui/card";
import EmptyState from "@/ui/empty-state";
import "./motion.page.scss";

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
	return `${days}d ago`;
};

const MotionPage: React.FC = () => {
	const navigate = useNavigate();
	const { current: currentWorkspace } = useWorkspace();
	const [loading, setLoading] = useState(true);
	const [allOpen, setAllOpen] = useState<ProposalWithDoc[]>([]);
	const cardsRef = useRef<HTMLDivElement>(null);

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
					for (const p of r.value.proposals.filter((p) => p.state === "open")) {
						flat.push({ proposal: p, document: r.value.doc });
					}
				}
			}

			// Detect conflicts
			const blockToProposals = new Map<string, string[]>();
			for (const { proposal } of flat) {
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

			const enriched = flat
				.map(({ proposal, document }) => ({
					proposal,
					document,
					hasConflict: conflictingIds.has(proposal.id),
				}))
				.sort(
					(a, b) =>
						new Date(b.proposal.created_at).getTime() - new Date(a.proposal.created_at).getTime()
				);

			setAllOpen(enriched);
			setLoading(false);
		};

		load().catch(() => setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [currentWorkspace]);

	// Animate cards on mount
	useEffect(() => {
		if (cardsRef.current && !loading && allOpen.length > 0) {
			const cards = cardsRef.current.querySelectorAll(".motion__card");
			gsap.from(cards, {
				opacity: 0,
				y: 12,
				stagger: 0.04,
				duration: 0.4,
				ease: "power2.out",
			});
		}
	}, [loading, allOpen.length]);

	const conflicts = useMemo(() => allOpen.filter((p) => p.hasConflict), [allOpen]);
	const normal = useMemo(() => allOpen.filter((p) => !p.hasConflict), [allOpen]);

	return (
		<div className="motion">
			<div className="motion__container">
				<header className="motion__header">
					<div>
						<h1 className="motion__title">Review</h1>
						<p className="motion__subtitle">
							{allOpen.length} open {allOpen.length === 1 ? "proposal" : "proposals"} waiting for your team.
						</p>
					</div>
				</header>

				{loading ? (
					<div className="motion__loading">
						{Array.from({ length: 3 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<div key={i} className="motion__skeleton" />
						))}
					</div>
				) : allOpen.length === 0 ? (
					<EmptyState
						heading="No open proposals"
						description="All proposals have been decided. Browse the Library and propose a change."
						cta={{
							label: "Browse Library",
							onClick: () => navigate("/truth"),
						}}
					/>
				) : (
					<div className="motion__sections" ref={cardsRef}>
						{conflicts.length > 0 && (
							<section className="motion__section">
								<div className="motion__section-header">
									<ExclamationTriangleIcon className="motion__conflict-warning-icon" />
									<h2 className="motion__section-heading">Conflicts ({conflicts.length})</h2>
								</div>
								<p className="motion__conflict-description">
									These proposals change the same content. Only one can be accepted.
								</p>
								<div className="motion__conflict-group">
									{conflicts.map(({ proposal, document }) => (
										<Card
											key={proposal.id}
											variant="glass"
											padding="md"
											onClick={() => navigate(`/proposals/${proposal.id}`)}
											className="motion__card motion__card--conflict"
										>
											<div className="motion__card-content">
												<div className="motion__card-header">
													<h3 className="motion__card-title">
														{proposal.title || "Untitled proposal"}
													</h3>
													<Badge variant="conflict" size="small">
														Conflict
													</Badge>
												</div>
												<p className="motion__card-meta">
													in {document.title || "Untitled document"}
													<span className="motion__card-dot">·</span>
													{relativeTime(proposal.created_at)}
												</p>
												{proposal.intent && (
													<p className="motion__card-intent">{proposal.intent}</p>
												)}
											</div>
										</Card>
									))}
								</div>
							</section>
						)}

						{normal.length > 0 && (
							<section className="motion__section">
								<h2 className="motion__section-heading">Open proposals ({normal.length})</h2>
								<div className="motion__cards">
									{normal.map(({ proposal, document }) => (
										<Card
											key={proposal.id}
											variant="glass"
											padding="md"
											onClick={() => navigate(`/proposals/${proposal.id}`)}
											className="motion__card"
										>
											<div className="motion__card-content">
												<h3 className="motion__card-title">
													{proposal.title || "Untitled proposal"}
												</h3>
												<p className="motion__card-meta">
													in {document.title || "Untitled document"}
													<span className="motion__card-dot">·</span>
													{relativeTime(proposal.created_at)}
												</p>
												{proposal.intent && (
													<p className="motion__card-intent">{proposal.intent}</p>
												)}
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

export default MotionPage;
