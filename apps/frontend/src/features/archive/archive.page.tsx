import { CheckCircleIcon, MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/24/solid";
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

import "./archive.page.scss";

interface ProposalWithDoc {
	proposal: Proposal;
	document: Document;
}

const formatDate = (iso: string): string =>
	new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

const ArchivePage: React.FC = () => {
	const navigate = useNavigate();
	const { current: currentWorkspace } = useWorkspace();
	const [loading, setLoading] = useState(true);
	const [decided, setDecided] = useState<ProposalWithDoc[]>([]);
	const [search, setSearch] = useState("");
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

			const flat: ProposalWithDoc[] = [];
			for (const r of results) {
				if (r.status === "fulfilled") {
					for (const p of r.value.proposals.filter((p) => p.state !== "open")) {
						flat.push({ proposal: p, document: r.value.doc });
					}
				}
			}

			flat.sort(
				(a, b) =>
					new Date(b.proposal.updated_at).getTime() - new Date(a.proposal.updated_at).getTime()
			);

			setDecided(flat);
			setLoading(false);
		};

		load().catch(() => setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [currentWorkspace]);

	const filtered = useMemo(() => {
		if (!search.trim()) return decided;
		const q = search.toLowerCase();
		return decided.filter(
			({ proposal, document }) =>
				proposal.title?.toLowerCase().includes(q) ||
				proposal.intent?.toLowerCase().includes(q) ||
				proposal.rejection_reason?.toLowerCase().includes(q) ||
				document.title?.toLowerCase().includes(q)
		);
	}, [decided, search]);

	// Group by month (reverse chronological)
	const grouped = useMemo(() => {
		const monthMap = new Map<string, ProposalWithDoc[]>();
		for (const item of filtered) {
			const date = new Date(item.proposal.updated_at);
			const key = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
			const existing = monthMap.get(key) ?? [];
			existing.push(item);
			monthMap.set(key, existing);
		}
		return [...monthMap.entries()].reverse();
	}, [filtered]);

	// Animate cards on mount
	useEffect(() => {
		if (cardsRef.current && !loading && filtered.length > 0) {
			const cards = cardsRef.current.querySelectorAll(".archive__card");
			gsap.from(cards, {
				opacity: 0,
				y: 12,
				stagger: 0.03,
				duration: 0.4,
				ease: "power2.out",
			});
		}
	}, [loading, filtered.length]);

	return (
		<div className="archive">
			<div className="archive__container">
				<header className="archive__header">
					<div className="archive__header-text">
						<h1 className="archive__title">Decisions</h1>
						<p className="archive__subtitle">
							Every proposal your team accepted or declined, with its reasoning preserved.
						</p>
					</div>
					<div className="archive__search-wrapper">
						<MagnifyingGlassIcon className="archive__search-icon" />
						<input
							type="search"
							className="archive__search"
							placeholder="Search decisions, reasoning…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</header>

				{loading ? (
					<div className="archive__loading">
						{Array.from({ length: 5 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<div key={i} className="archive__skeleton" />
						))}
					</div>
				) : decided.length === 0 ? (
					<div className="archive__empty">
						<p className="archive__empty-heading">No decisions recorded yet</p>
						<p className="archive__empty-text">
							Once proposals are accepted or declined, they appear here with their reasoning intact.
						</p>
					</div>
				) : filtered.length === 0 ? (
					<div className="archive__empty">
						<p className="archive__empty-heading">No results</p>
						<p className="archive__empty-text">No decisions match your search.</p>
					</div>
				) : (
					<div className="archive__timeline" ref={cardsRef}>
						{grouped.map(([month, entries]) => (
							<section key={month} className="archive__month">
								<h2 className="archive__month-heading">{month}</h2>
								<div className="archive__month-cards">
									{entries.map(({ proposal }) => (
										<Card
											key={proposal.id}
											variant="glass"
											padding="md"
											onClick={() => navigate(`/proposals/${proposal.id}`)}
											className="archive__card"
										>
											<div className="archive__card-header">
												<div className="archive__card-status">
													{proposal.state === "accepted" ? (
														<>
															<CheckCircleIcon className="archive__card-icon archive__card-icon--accepted" />
															<Badge variant="accepted" size="small">Accepted</Badge>
														</>
													) : (
														<>
															<XCircleIcon className="archive__card-icon archive__card-icon--declined" />
															<Badge variant="declined" size="small">Declined</Badge>
														</>
													)}
												</div>
												<span className="archive__card-date">{formatDate(proposal.updated_at)}</span>
											</div>
											<h3 className="archive__card-title">{proposal.title || "Untitled proposal"}</h3>
											{proposal.intent && (
												<p className="archive__card-intent">{proposal.intent}</p>
											)}
											{proposal.rejection_reason && (
												<blockquote className="archive__card-reason">
													"{proposal.rejection_reason}"
												</blockquote>
											)}
										</Card>
									))}
								</div>
							</section>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default ArchivePage;
