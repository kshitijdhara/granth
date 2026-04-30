import {
	ArrowLeftIcon,
	InformationCircleIcon,
	PaperAirplaneIcon,
	PlusIcon,
	TrashIcon,
	XMarkIcon,
} from "@heroicons/react/24/solid";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { blocksApi } from "@/features/documents/blocks.api";
import { documentsApi } from "@/features/documents/documents.api";
import type { Block, Document } from "@/features/documents/types";
import { proposalsApi } from "@/features/proposals/proposals.api";
import "./composer.page.scss";

// ─── Types ───────────────────────────────────────────────────────────────────

type ChangeAction = "create" | "update" | "delete";

interface BlockChange {
	action: ChangeAction;
	blockId: string | null;
	blockType: string;
	orderPath: number[];
	content: string;
	localId: string;
}

interface LocalBlock {
	localId: string;
	serverBlockId: string | null;
	blockType: "text" | "header" | "code";
	orderPath: number[];
	content: string;
	isNew: boolean;
	isDeleted: boolean;
	originalContent?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const semanticLabel = (changes: BlockChange[]): string[] => {
	const labels: string[] = [];
	const creates = changes.filter((c) => c.action === "create").length;
	const updates = changes.filter((c) => c.action === "update").length;
	const deletes = changes.filter((c) => c.action === "delete").length;

	if (creates > 0) labels.push(`Adds ${creates} new ${creates === 1 ? "claim" : "claims"}`);
	if (updates > 0)
		labels.push(`Modifies ${updates} existing ${updates === 1 ? "claim" : "claims"}`);
	if (deletes > 0) labels.push(`Removes ${deletes} ${deletes === 1 ? "claim" : "claims"}`);
	return labels;
};

const tempId = () => `local-${Math.random().toString(36).slice(2)}`;

const toLocalBlock = (b: Block): LocalBlock => ({
	localId: tempId(),
	serverBlockId: b.id,
	blockType: b.block_type as "text" | "header" | "code",
	orderPath: b.order_path,
	content: b.content,
	isNew: false,
	isDeleted: false,
	originalContent: b.content,
});

// ─── Block Editor ─────────────────────────────────────────────────────────────

interface BlockEditorProps {
	block: LocalBlock;
	index: number;
	onContentChange: (localId: string, content: string) => void;
	onDelete: (localId: string) => void;
	onEnterAt: (localId: string, afterContent: string, remainingContent: string) => void;
	onFocusPrev: (index: number) => void;
	onFocusNext: (index: number) => void;
	focusRef?: React.RefCallback<HTMLTextAreaElement>;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
	block,
	index,
	onContentChange,
	onDelete,
	onEnterAt,
	onFocusPrev,
	onFocusNext,
	focusRef,
}) => {
	const ref = useRef<HTMLTextAreaElement | null>(null);

	const autoResize = (el: HTMLTextAreaElement) => {
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	};

	const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		const el = e.currentTarget;
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			const at = el.selectionStart;
			onEnterAt(block.localId, el.value.slice(0, at), el.value.slice(at));
		} else if (e.key === "Backspace" && el.value === "") {
			e.preventDefault();
			onDelete(block.localId);
		} else if (e.key === "ArrowUp" && el.selectionStart === 0) {
			onFocusPrev(index);
		} else if (e.key === "ArrowDown" && el.selectionStart === el.value.length) {
			onFocusNext(index);
		}
	};

	if (block.isDeleted) return null;

	const isModified = block.originalContent !== undefined && block.content !== block.originalContent;
	const stateClass = block.isNew ? "block-editor--new" : isModified ? "block-editor--modified" : "";

	return (
		<div className={`block-editor ${stateClass}`}>
			{block.isNew && <span className="block-editor__badge block-editor__badge--new">+</span>}
			{isModified && <span className="block-editor__badge block-editor__badge--modified">~</span>}
			<textarea
				ref={(el) => {
					if (el) {
						ref.current = el;
						if (focusRef) focusRef(el);
						autoResize(el);
					}
				}}
				className={`block-editor__textarea block-editor__textarea--${block.blockType}`}
				value={block.content}
				placeholder={
					block.blockType === "header"
						? "Heading…"
						: block.blockType === "code"
							? "Code…"
							: "Claim or statement…"
				}
				onChange={(e) => {
					onContentChange(block.localId, e.target.value);
					autoResize(e.currentTarget);
				}}
				onKeyDown={handleKey}
				rows={1}
			/>
			<button
				type="button"
				className="block-editor__delete"
				onClick={() => onDelete(block.localId)}
				title="Remove"
			>
				<TrashIcon className="block-editor__delete-icon" />
			</button>
		</div>
	);
};

// ─── Main Composer ────────────────────────────────────────────────────────────

const ComposerPage: React.FC = () => {
	const { id: documentId } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [document, setDocument] = useState<Document | null>(null);
	const [blocks, setBlocks] = useState<LocalBlock[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [showTextDiff, setShowTextDiff] = useState(false);

	// Reasoning pane state
	const [proposalTitle, setProposalTitle] = useState("");
	const [reasoning, setReasoning] = useState("");

	// Focus management
	const focusRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

	useEffect(() => {
		if (!documentId) return;
		setLoading(true);
		Promise.all([documentsApi.get(documentId), blocksApi.getAll(documentId)])
			.then(([doc, rawBlocks]) => {
				const sorted = [...rawBlocks].sort(
					(a, b) => (a.order_path[0] ?? 0) - (b.order_path[0] ?? 0)
				);
				setDocument(doc);
				setBlocks(
					sorted.length > 0
						? sorted.map(toLocalBlock)
						: [
								{
									localId: tempId(),
									serverBlockId: null,
									blockType: "text",
									orderPath: [1000],
									content: "",
									isNew: true,
									isDeleted: false,
								},
							]
				);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [documentId]);

	const handleContentChange = useCallback((localId: string, content: string) => {
		setBlocks((prev) => prev.map((b) => (b.localId === localId ? { ...b, content } : b)));
	}, []);

	const handleDelete = useCallback((localId: string) => {
		setBlocks((prev) => {
			const idx = prev.findIndex((b) => b.localId === localId);
			const b = prev[idx];
			if (!b) return prev;
			if (b.isNew) {
				const next = prev.filter((_, i) => i !== idx);
				const focusTarget = next[Math.max(0, idx - 1)];
				if (focusTarget) {
					setTimeout(() => focusRefs.current.get(focusTarget.localId)?.focus(), 0);
				}
				return next;
			}
			const next = prev.map((block) =>
				block.localId === localId ? { ...block, isDeleted: true, content: "" } : block
			);
			const focusTarget = next.filter((bl) => !bl.isDeleted)[Math.max(0, idx - 1)];
			if (focusTarget) {
				setTimeout(() => focusRefs.current.get(focusTarget.localId)?.focus(), 0);
			}
			return next;
		});
	}, []);

	const handleEnterAt = useCallback(
		(localId: string, beforeContent: string, afterContent: string) => {
			setBlocks((prev) => {
				const idx = prev.findIndex((b) => b.localId === localId);
				if (idx === -1) return prev;
				const current = prev[idx];
				if (!current) return prev;
				const newBlock: LocalBlock = {
					localId: tempId(),
					serverBlockId: null,
					blockType: "text",
					orderPath: [(current.orderPath[0] ?? 0) + 500],
					content: afterContent,
					isNew: true,
					isDeleted: false,
				};
				const updated = prev.map((b) =>
					b.localId === localId ? { ...b, content: beforeContent } : b
				);
				updated.splice(idx + 1, 0, newBlock);
				setTimeout(() => focusRefs.current.get(newBlock.localId)?.focus(), 0);
				return updated;
			});
		},
		[]
	);

	const handleFocusPrev = useCallback(
		(index: number) => {
			const visible = blocks.filter((b) => !b.isDeleted);
			const target = visible[index - 1];
			if (target) focusRefs.current.get(target.localId)?.focus();
		},
		[blocks]
	);

	const handleFocusNext = useCallback(
		(index: number) => {
			const visible = blocks.filter((b) => !b.isDeleted);
			const target = visible[index + 1];
			if (target) focusRefs.current.get(target.localId)?.focus();
		},
		[blocks]
	);

	const handleAddBlock = (blockType: "text" | "header" | "code") => {
		const maxOrder = Math.max(0, ...blocks.map((b) => b.orderPath[0] ?? 0));
		const newBlock: LocalBlock = {
			localId: tempId(),
			serverBlockId: null,
			blockType,
			orderPath: [maxOrder + 1000],
			content: "",
			isNew: true,
			isDeleted: false,
		};
		setBlocks((prev) => [...prev, newBlock]);
		setTimeout(() => focusRefs.current.get(newBlock.localId)?.focus(), 0);
	};

	// Compute changes for display and submission
	const pendingChanges: BlockChange[] = [];
	for (const b of blocks) {
		if (b.isNew && b.content.trim() !== "") {
			pendingChanges.push({
				action: "create",
				blockId: null,
				blockType: b.blockType,
				orderPath: b.orderPath,
				content: b.content,
				localId: b.localId,
			});
		} else if (!b.isNew && b.isDeleted && b.serverBlockId) {
			pendingChanges.push({
				action: "delete",
				blockId: b.serverBlockId,
				blockType: b.blockType,
				orderPath: b.orderPath,
				content: b.content,
				localId: b.localId,
			});
		} else if (!b.isNew && !b.isDeleted && b.content !== b.originalContent && b.serverBlockId) {
			pendingChanges.push({
				action: "update",
				blockId: b.serverBlockId,
				blockType: b.blockType,
				orderPath: b.orderPath,
				content: b.content,
				localId: b.localId,
			});
		}
	}

	const semanticLabels = semanticLabel(pendingChanges);
	const affectedBlockIds = pendingChanges
		.filter((c) => c.blockId !== null)
		.map((c) => c.blockId as string);

	const handleSend = async () => {
		if (!documentId || pendingChanges.length === 0 || !reasoning.trim()) return;
		setSubmitting(true);
		try {
			const inferredTitle =
				proposalTitle.trim() ||
				reasoning.trim().split("\n")[0]?.slice(0, 80) ||
				"Untitled proposal";
			const res = await proposalsApi.create(documentId, {
				title: inferredTitle,
				intent: reasoning.trim(),
				scope: semanticLabels.join("; "),
				affected_block_ids: affectedBlockIds,
			});

			await Promise.all(
				pendingChanges.map((c) =>
					proposalsApi.addBlockChange(res.proposal_id, {
						block_id: c.blockId,
						action: c.action,
						block_type: c.blockType,
						order_path: c.orderPath,
						content: c.content,
					})
				)
			);

			navigate(`/proposals/${res.proposal_id}`);
		} catch (e) {
			console.error(e);
		} finally {
			setSubmitting(false);
		}
	};

	const canSend = pendingChanges.length > 0 && reasoning.trim().length > 0;

	if (loading) {
		return (
			<div className="composer composer--loading">
				<div className="composer__loading-inner">
					<div className="composer__skeleton composer__skeleton--title" />
					<div className="composer__skeleton" />
					<div className="composer__skeleton composer__skeleton--short" />
				</div>
			</div>
		);
	}

	const visibleBlocks = blocks.filter((b) => !b.isDeleted);

	return (
		<div className="composer">
			{/* Chrome bar */}
			<div className="composer__chrome">
				<div className="composer__chrome-left">
					<button
						type="button"
						className="composer__back"
						onClick={() => navigate(documentId ? `/truth/${documentId}` : "/truth")}
					>
						<ArrowLeftIcon className="composer__back-icon" />
						{document?.title || "Truth"}
					</button>
					<span className="composer__chrome-label">Proposing a change</span>
				</div>
				<div className="composer__chrome-right">
					<button
						type="button"
						className="composer__discard"
						onClick={() => navigate(documentId ? `/truth/${documentId}` : "/truth")}
					>
						<XMarkIcon className="composer__discard-icon" />
						Discard
					</button>
					<button
						type="button"
						className={`composer__send ${canSend ? "composer__send--ready" : ""}`}
						onClick={handleSend}
						disabled={!canSend || submitting}
					>
						<PaperAirplaneIcon className="composer__send-icon" />
						{submitting ? "Sending…" : "Send when ready"}
					</button>
				</div>
			</div>

			<div className="composer__body">
				{/* Left: Draft pane */}
				<div className="composer__draft">
					<div className="composer__draft-header">
						<span className="composer__pane-label">YOUR DRAFT</span>
					</div>

					<div className="composer__draft-title-wrapper">
						<textarea
							className="composer__draft-title"
							value={proposalTitle}
							placeholder="Optional: give your proposal a title"
							onChange={(e) => setProposalTitle(e.target.value)}
							rows={1}
							onInput={(e) => {
								const el = e.currentTarget;
								el.style.height = "auto";
								el.style.height = `${el.scrollHeight}px`;
							}}
						/>
					</div>

					<div className="composer__blocks">
						{visibleBlocks.map((block, index) => (
							<BlockEditor
								key={block.localId}
								block={block}
								index={index}
								onContentChange={handleContentChange}
								onDelete={handleDelete}
								onEnterAt={handleEnterAt}
								onFocusPrev={handleFocusPrev}
								onFocusNext={handleFocusNext}
								focusRef={(el) => {
									if (el) focusRefs.current.set(block.localId, el);
									else focusRefs.current.delete(block.localId);
								}}
							/>
						))}
					</div>

					<div className="composer__add-block">
						<button
							type="button"
							className="composer__add-btn"
							onClick={() => handleAddBlock("text")}
							title="Add text claim"
						>
							<PlusIcon className="composer__add-icon" />
							Add claim
						</button>
						<button
							type="button"
							className="composer__add-btn composer__add-btn--secondary"
							onClick={() => handleAddBlock("header")}
						>
							Heading
						</button>
						<button
							type="button"
							className="composer__add-btn composer__add-btn--secondary"
							onClick={() => handleAddBlock("code")}
						>
							Code
						</button>
					</div>

					{/* What this changes */}
					{pendingChanges.length > 0 && (
						<div className="composer__diff-summary">
							<div className="composer__diff-summary-header">
								<span className="composer__diff-label">WHAT THIS CHANGES</span>
								<button
									type="button"
									className="composer__show-diff"
									onClick={() => setShowTextDiff((v) => !v)}
								>
									{showTextDiff ? "hide text diff" : "› show text diff"}
								</button>
							</div>
							<ul className="composer__diff-list">
								{semanticLabels.map((label) => (
									<li key={label} className="composer__diff-item">
										{label}
									</li>
								))}
								<li className="composer__diff-item">
									Affects {pendingChanges.length} {pendingChanges.length === 1 ? "block" : "blocks"}
								</li>
							</ul>
							{showTextDiff && (
								<div className="composer__text-diff">
									{pendingChanges.map((c) => (
										<div key={c.localId} className="composer__text-diff-row">
											<span className={`composer__diff-action composer__diff-action--${c.action}`}>
												{c.action === "create" ? "+" : c.action === "delete" ? "−" : "~"}
											</span>
											<span className="composer__diff-content">
												{c.content.slice(0, 120)}
												{c.content.length > 120 ? "…" : ""}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Right: Reasoning pane */}
				<div className="composer__why">
					<div className="composer__why-header">
						<span className="composer__pane-label">WHY</span>
						<div
							className="composer__why-hint"
							title="A proposal without reasoning is incomplete. The group will use this to decide."
						>
							<InformationCircleIcon className="composer__why-hint-icon" />
							Required — helps the group decide
						</div>
					</div>

					<textarea
						className="composer__reasoning"
						value={reasoning}
						placeholder={
							"Explain why this change is needed.\n\nWhat problem does it solve? What did the group previously believe, and why should that belief change? What alternatives did you consider?"
						}
						onChange={(e) => setReasoning(e.target.value)}
					/>

					{!reasoning.trim() && (
						<p className="composer__reasoning-hint">
							A proposal without reasoning is visibly incomplete. The group needs to understand the
							why before they can decide.
						</p>
					)}

					{canSend && (
						<button
							type="button"
							className="composer__send composer__send--inline composer__send--ready"
							onClick={handleSend}
							disabled={submitting}
						>
							<PaperAirplaneIcon className="composer__send-icon" />
							{submitting ? "Sending…" : "Send when ready"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default ComposerPage;
