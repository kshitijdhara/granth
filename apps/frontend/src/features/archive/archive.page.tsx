import { CheckCircleIcon, MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/24/solid";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentsApi } from "@/features/documents/documents.api";
import type { Document } from "@/features/documents/types";
import type { Proposal } from "@/features/proposals/proposals.api";
import { proposalsApi } from "@/features/proposals/proposals.api";
import { useWorkspace } from "@/features/workspaces/workspace.context";
import { workspacesApi } from "@/features/workspaces/workspaces.api";
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

	// Group by document
	const grouped = useMemo(() => {
		const map = new Map<string, { document: Document; entries: ProposalWithDoc[] }>();
		for (const item of filtered) {
			const key = item.document.id;
			const existing = map.get(key);
			if (existing) {
				existing.entries.push(item);
			} else {
				map.set(key, { document: item.document, entries: [item] });
			}
		}
		return [...map.values()];
	}, [filtered]);

	return (
		<div className="archive">
			<div className="archive__container">
				<header className="archive__header">
					<div className="archive__header-text">
						<h1 className="archive__title">Reasoning archive</h1>
						<p className="archive__subtitle">
							Every decision your group has made — including the ones that were declined. The
							reasoning behind each is preserved permanently.
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
					<div className="archive__groups">
						{grouped.map(({ document, entries }) => (
							<section key={document.id} className="archive__group">
								<h2 className="archive__group-heading">
									<button
										type="button"
										className="archive__group-title-btn"
										onClick={() => navigate(`/truth/${document.id}`)}
									>
										{document.title || "Untitled body"}
									</button>
								</h2>
								<ul className="archive__timeline">
									{entries.map(({ proposal }) => (
										<li key={proposal.id} className="archive__timeline-item">
											<div className="archive__timeline-marker">
												{proposal.state === "accepted" ? (
													<CheckCircleIcon className="archive__timeline-icon archive__timeline-icon--accepted" />
												) : (
													<XCircleIcon className="archive__timeline-icon archive__timeline-icon--declined" />
												)}
											</div>
											<button
												type="button"
												className="archive__entry"
												onClick={() => navigate(`/proposals/${proposal.id}`)}
											>
												<div className="archive__entry-header">
													<span className="archive__entry-date">
														{formatDate(proposal.updated_at)}
													</span>
													<span
														className={`archive__entry-state archive__entry-state--${proposal.state}`}
													>
														{proposal.state === "accepted" ? "Adopted" : "Considered & Declined"}
													</span>
												</div>
												<p className="archive__entry-title">
													{proposal.title || "Untitled proposal"}
												</p>
												{proposal.intent && (
													<p className="archive__entry-intent">{proposal.intent}</p>
												)}
												{proposal.rejection_reason && (
													<blockquote className="archive__entry-reason">
														"{proposal.rejection_reason}"
													</blockquote>
												)}
											</button>
										</li>
									))}
								</ul>
							</section>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default ArchivePage;
