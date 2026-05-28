import { ArrowLeftIcon, ClockIcon, PencilSquareIcon, PlusIcon } from "@heroicons/react/24/solid";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { blocksApi } from "@/features/documents/blocks.api";
import { documentsApi } from "@/features/documents/documents.api";
import type { Block, Document } from "@/features/documents/types";
import type { Proposal } from "@/features/proposals/proposals.api";
import { proposalsApi } from "@/features/proposals/proposals.api";
import { useWorkspace } from "@/features/workspaces/workspace.context";
import { workspacesApi } from "@/features/workspaces/workspaces.api";
import Button from "@/ui/button";
import Card from "@/ui/card";
import "./truth.page.scss";

const relativeDate = (iso: string): string => {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const formatContent = (content: string): string => {
	return content
		.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
		.replace(/\*(.+?)\*/g, "<em>$1</em>")
		.replace(/`(.+?)`/g, "<code>$1</code>");
};

// ────────────────────────────────────────────────────────────────────────────
// Canonical reading view for a single body
// ────────────────────────────────────────────────────────────────────────────

const TruthDetailView: React.FC<{ documentId: string }> = ({ documentId }) => {
	const navigate = useNavigate();
	const [document, setDocument] = useState<Document | null>(null);
	const [blocks, setBlocks] = useState<Block[]>([]);
	const [proposals, setProposals] = useState<Proposal[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);

	// Map block_id → open proposals that touch it
	const [blockProposalMap, setBlockProposalMap] = useState<Map<string, Proposal[]>>(new Map());

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setDocument(null);
		setBlocks([]);
		setProposals([]);
		setBlockProposalMap(new Map());

		const applyProposals = (rawProposals: Proposal[]) => {
			setProposals(rawProposals);
			const openProposals = rawProposals.filter((p) => p.state === "open");
			const map = new Map<string, Proposal[]>();
			for (const p of openProposals) {
				for (const blockId of p.affected_block_ids) {
					const existing = map.get(blockId) ?? [];
					existing.push(p);
					map.set(blockId, existing);
				}
			}
			setBlockProposalMap(map);
		};

		documentsApi
			.get(documentId)
			.then(async (doc) => {
				if (cancelled) return;
				setDocument(doc);

				const [blocksResult, proposalsResult] = await Promise.allSettled([
					blocksApi.getAll(documentId),
					proposalsApi.getForDocument(documentId),
				]);
				if (cancelled) return;

				if (blocksResult.status === "fulfilled") {
					const sorted = [...blocksResult.value].sort(
						(a, b) => (a.order_path[0] ?? 0) - (b.order_path[0] ?? 0)
					);
					setBlocks(sorted);
				} else {
					console.error(blocksResult.reason);
				}

				if (proposalsResult.status === "fulfilled") {
					applyProposals(proposalsResult.value);
				} else {
					console.error(proposalsResult.reason);
				}
			})
			.catch((err) => {
				if (!cancelled) console.error(err);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [documentId]);

	const handleAddThought = async () => {
		if (creating) return;
		setCreating(true);
		navigate(`/truth/${documentId}/compose`);
	};

	const openProposals = proposals.filter((p) => p.state === "open");
	const openCount = openProposals.length;

	if (loading) {
		return (
			<div className="truth-detail">
				<div className="truth-detail__loading">
					<div className="truth-detail__skeleton truth-detail__skeleton--title" />
					<div className="truth-detail__skeleton truth-detail__skeleton--meta" />
					<div className="truth-detail__skeleton truth-detail__skeleton--body" />
					<div className="truth-detail__skeleton truth-detail__skeleton--body" />
					<div className="truth-detail__skeleton truth-detail__skeleton--body truth-detail__skeleton--short" />
				</div>
			</div>
		);
	}

	if (!document) {
		return (
			<div className="truth-detail truth-detail--error">
				<p>This document could not be found.</p>
				<Button variant="secondary" size="small" onClick={() => navigate("/truth")}>
					Back to Library
				</Button>
			</div>
		);
	}

	return (
		<div className="truth-detail">
			<div className="truth-detail__chrome">
				<button type="button" className="truth-detail__back" onClick={() => navigate("/truth")}>
					<ArrowLeftIcon className="truth-detail__back-icon" />
					Library
				</button>
				<div className="truth-detail__chrome-right">
					{openCount > 0 && (
						<span className="truth-detail__proposal-count">
							{openCount} open {openCount === 1 ? "proposal" : "proposals"}
						</span>
					)}
					<div className="truth-detail__time-tag">
						<ClockIcon className="truth-detail__time-icon" />
						<span>as of today</span>
					</div>
					<button
						type="button"
						className="truth-detail__compose-btn"
						onClick={handleAddThought}
						disabled={creating}
					>
						<PencilSquareIcon className="truth-detail__compose-icon" />
						{creating ? "Opening…" : "Propose a change"}
					</button>
				</div>
			</div>

			<article className="truth-detail__article">
				<header className="truth-detail__article-header">
					<h1 className="truth-detail__doc-title">{document.title || "Untitled"}</h1>
					<p className="truth-detail__doc-meta">
						Added {relativeDate(document.created_at)}
						{document.updated_at !== document.created_at && (
							<> · last amended {relativeDate(document.updated_at)}</>
						)}
					</p>
				</header>

				<div className="truth-detail__body">
					{blocks.length === 0 ? (
						<div className="truth-detail__empty">
							<p>No content yet.</p>
							<button type="button" className="truth-detail__empty-cta" onClick={handleAddThought}>
								Add the first paragraph →
							</button>
						</div>
					) : (
						blocks.map((block) => {
							const touchingProposals = blockProposalMap.get(block.id) ?? [];
							const hasProposal = touchingProposals.length > 0;

							return (
								<div
									key={block.id}
									className={`truth-detail__block ${hasProposal ? "truth-detail__block--has-proposal" : ""}`}
								>
									{hasProposal && (
										<div className="truth-detail__gutter-marker">
											{touchingProposals.map((p) => (
												<button
													type="button"
													key={p.id}
													className="truth-detail__gutter-dot"
													title={p.title || "Open proposal"}
													onClick={() => navigate(`/proposals/${p.id}`)}
												/>
											))}
										</div>
									)}
									<div className="truth-detail__block-content">
										{block.block_type === "header" && (
											<h2
												className="truth-detail__heading"
												// biome-ignore lint/security/noDangerouslySetInnerHtml: controlled markdown content
												dangerouslySetInnerHTML={{ __html: formatContent(block.content) }}
											/>
										)}
										{block.block_type === "text" && (
											<p
												className="truth-detail__paragraph"
												// biome-ignore lint/security/noDangerouslySetInnerHtml: controlled markdown content
												dangerouslySetInnerHTML={{ __html: formatContent(block.content) }}
											/>
										)}
										{block.block_type === "code" && (
											<pre className="truth-detail__code">
												<code>{block.content}</code>
											</pre>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>

				<div className="truth-detail__add-thought">
					<button
						type="button"
						className="truth-detail__add-thought-btn"
						onClick={handleAddThought}
						disabled={creating}
					>
						<PlusIcon className="truth-detail__add-thought-icon" />
						Add a block
					</button>
					<span className="truth-detail__add-thought-hint">
						Your changes stay in draft until you submit.
					</span>
				</div>
			</article>
		</div>
	);
};

// ────────────────────────────────────────────────────────────────────────────
// List of all bodies in the current workspace
// ────────────────────────────────────────────────────────────────────────────

const TruthListView: React.FC = () => {
	const navigate = useNavigate();
	const { current: currentWorkspace, loading: workspaceLoading } = useWorkspace();
	const workspaceId = currentWorkspace?.id ?? null;
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		if (workspaceLoading) return;

		let cancelled = false;
		setLoading(true);

		const fetch = workspaceId
			? workspacesApi.getDocuments(workspaceId)
			: documentsApi.getAll();

		fetch
			.then((docs) => {
				if (cancelled) return;
				setDocuments(
					[...docs].sort(
						(a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
					)
				);
			})
			.catch((err) => {
				if (!cancelled) console.error(err);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [workspaceId, workspaceLoading]);

	const handleCreate = async () => {
		if (creating || !currentWorkspace) return;
		setCreating(true);
		try {
			const res = await documentsApi.create("Untitled", currentWorkspace.id);
			if (res?.document_id) navigate(`/truth/${res.document_id}/compose`);
		} catch {
			setCreating(false);
		}
	};

	return (
		<div className="truth-list">
			<div className="truth-list__container">
				<header className="truth-list__header">
					<div className="truth-list__header-text">
						<h1 className="truth-list__title">Library</h1>
						<p className="truth-list__subtitle">
							Your team's documents — every accepted change recorded with its reasoning.
						</p>
					</div>
					<Button variant="primary" size="medium" onClick={handleCreate} isDisabled={!currentWorkspace || creating}>
						<PlusIcon style={{ width: 16, height: 16 }} />
						{creating ? "Creating…" : "New document"}
					</Button>
				</header>

				{loading ? (
					<div className="truth-list__loading">
						{Array.from({ length: 4 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<div key={i} className="truth-list__skeleton" />
						))}
					</div>
				) : documents.length === 0 ? (
					<div className="truth-list__empty">
						<p className="truth-list__empty-heading">No documents yet</p>
						<p className="truth-list__empty-text">
							Documents hold your team's shared knowledge. Every accepted change is saved with its reasoning, permanently.
						</p>
						<Button variant="primary" size="medium" onClick={handleCreate} isDisabled={!currentWorkspace || creating}>
							<PlusIcon style={{ width: 16, height: 16 }} />
							{creating ? "Creating…" : "Create your first document"}
						</Button>
					</div>
				) : (
					<ul className="truth-list__items">
						{documents.map((doc) => (
							<li key={doc.id}>
								<Card
									variant="default"
									padding="md"
									onClick={() => navigate(`/truth/${doc.id}`)}
									className="truth-list__item"
								>
									<div className="truth-list__item-main">
										<h2 className="truth-list__item-title">{doc.title || "Untitled"}</h2>
										<p className="truth-list__item-meta">
											Last amended{" "}
											{new Date(doc.updated_at).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: "numeric",
											})}
										</p>
									</div>
									<div className="truth-list__item-actions">
										<button
											type="button"
											className="truth-list__item-propose"
											onClick={(e) => {
												e.stopPropagation();
												navigate(`/truth/${doc.id}/compose`);
											}}
										>
											Propose a change
										</button>
									</div>
								</Card>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

// ────────────────────────────────────────────────────────────────────────────
// Router shim — renders list or detail based on params
// ────────────────────────────────────────────────────────────────────────────

const TruthPage: React.FC = () => {
	const { id } = useParams<{ id?: string }>();
	return id ? <TruthDetailView documentId={id} /> : <TruthListView />;
};

export default TruthPage;
