import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentsApi } from "@/features/documents/documents.api";
import type { Document } from "@/features/documents/types";
import type { Proposal } from "@/features/proposals/proposals.api";
import { proposalsApi } from "@/features/proposals/proposals.api";
import { useWorkspace } from "@/features/workspaces/workspace.context";
import { workspacesApi } from "@/features/workspaces/workspaces.api";
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

	const conflicts = useMemo(() => allOpen.filter((p) => p.hasConflict), [allOpen]);
	const normal = useMemo(() => allOpen.filter((p) => !p.hasConflict), [allOpen]);

	return (
		<div className="motion">
			<div className="motion__container">
				<header className="motion__header">
					<h1 className="motion__title">In Motion</h1>
					<p className="motion__subtitle">
						All open proposals across your workspace — changes that have been proposed but not yet
						decided.
					</p>
				</header>

				{loading ? (
					<div className="motion__loading">
						{Array.from({ length: 3 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<div key={i} className="motion__skeleton" />
						))}
					</div>
				) : allOpen.length === 0 ? (
					<div className="motion__empty">
						<p className="motion__empty-heading">Nothing in motion</p>
						<p className="motion__empty-text">
							No open proposals right now.{" "}
							<button
								type="button"
								className="motion__empty-link"
								onClick={() => navigate("/truth")}
							>
								Browse the truth
							</button>{" "}
							and propose a change.
						</p>
					</div>
				) : (
					<div className="motion__sections">
						{conflicts.length > 0 && (
							<section className="motion__section">
								<h2 className="motion__section-heading motion__section-heading--conflict">
									<ExclamationTriangleIcon className="motion__conflict-icon" />
									Conflicts ({conflicts.length})
								</h2>
								<p className="motion__conflict-description">
									These proposals touch overlapping claims and cannot both be accepted without
									resolution.
								</p>
								<ul className="motion__list">
									{conflicts.map(({ proposal, document }) => (
										<li key={proposal.id}>
											<button
												type="button"
												className="motion__row motion__row--conflict"
												onClick={() => navigate(`/proposals/${proposal.id}`)}
											>
												<div className="motion__row-main">
													<div className="motion__row-title">
														{proposal.title || "Untitled proposal"}
													</div>
													<div className="motion__row-meta">
														in {document.title || "Untitled body"}
														<span className="motion__row-dot">·</span>
														{relativeTime(proposal.created_at)}
													</div>
													{proposal.intent && (
														<div className="motion__row-intent">{proposal.intent}</div>
													)}
												</div>
												<ExclamationTriangleIcon className="motion__row-conflict-icon" />
											</button>
										</li>
									))}
								</ul>
							</section>
						)}

						{normal.length > 0 && (
							<section className="motion__section">
								<h2 className="motion__section-heading">Open proposals ({normal.length})</h2>
								<ul className="motion__list">
									{normal.map(({ proposal, document }) => (
										<li key={proposal.id}>
											<button
												type="button"
												className="motion__row"
												onClick={() => navigate(`/proposals/${proposal.id}`)}
											>
												<div className="motion__row-main">
													<div className="motion__row-title">
														{proposal.title || "Untitled proposal"}
													</div>
													<div className="motion__row-meta">
														in {document.title || "Untitled body"}
														<span className="motion__row-dot">·</span>
														{relativeTime(proposal.created_at)}
													</div>
													{proposal.intent && (
														<div className="motion__row-intent">{proposal.intent}</div>
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

export default MotionPage;
