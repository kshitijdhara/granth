import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { proposalsApi } from "@/features/proposals/proposals.api";
import DocumentLayout from "@/layouts/document.layout";
import Button from "@/ui/button";
import BlockView from "./block";
import { blocksApi } from "./blocks.api";
import { documentsApi } from "./documents.api";
import ProposalForm from "./proposal-form";
import type { Block, Document } from "./types";
import "./document-editor.page.scss";

type Change = { action: "create" | "update" | "delete"; block: Block };

const compareOrderPaths = (a: number[], b: number[]): number => {
	const len = Math.min(a.length, b.length);
	for (let i = 0; i < len; i++) {
		const ai = a[i] ?? 0;
		const bi = b[i] ?? 0;
		if (ai !== bi) return ai - bi;
	}
	return a.length - b.length;
};

const DocumentEditorPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [document, setDocument] = useState<Document | null>(null);
	const [title, setTitle] = useState("");
	const [blocks, setBlocks] = useState<Block[]>([]);
	const [addingAt, setAddingAt] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [adding, setAdding] = useState(false);
	const [changes, setChanges] = useState<Change[]>([]);
	const [showProposalForm, setShowProposalForm] = useState(false);

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		Promise.all([documentsApi.get(id), blocksApi.getAll(id).catch(() => [])])
			.then(([doc, blks]) => {
				setDocument(doc);
				setTitle(doc.title ?? "");
				setBlocks(
					(blks as Block[]).sort((a, b) =>
						compareOrderPaths(a.order_path ?? [], b.order_path ?? [])
					)
				);
			})
			.catch((err) => console.error("Failed to load document", err))
			.finally(() => setLoading(false));
	}, [id]);

	const handleCreateProposal = async (data: { title: string; intent: string; scope: string }) => {
		if (!id || changes.length === 0) return;
		setSaving(true);
		try {
			const affectedBlockIds = [
				...new Set(changes.filter((c) => c.action !== "create").map((c) => c.block.id)),
			];
			const { proposal_id } = await proposalsApi.create(id, {
				title: data.title || "Proposal",
				intent: data.intent || "Edit document",
				scope: data.scope || "Document changes",
				affected_block_ids: affectedBlockIds,
			});
			for (const change of changes) {
				await proposalsApi.addBlockChange(proposal_id, {
					block_id: change.action === "create" ? null : change.block.id,
					action: change.action,
					block_type: change.block.block_type,
					order_path: change.block.order_path ?? [],
					content: change.block.content,
				});
			}
			navigate(`/documents/${id}`);
		} catch (err) {
			console.error("Failed to create proposal", err);
			alert("Failed to create proposal");
		} finally {
			setSaving(false);
			setShowProposalForm(false);
		}
	};

	const handleAddBlock = async (parentId: string | null, type: string) => {
		if (adding || !id) return;
		setAdding(true);
		try {
			let newOrderPath: number[];
			if (parentId === null) {
				const max = blocks.length > 0 ? Math.max(...blocks.map((b) => b.order_path?.[0] ?? 0)) : 0;
				newOrderPath = [max + 1000];
			} else {
				const parent = blocks.find((b) => b.id === parentId);
				if (!parent) return;
				const children = blocks.filter(
					(b) =>
						b.order_path.length === parent.order_path.length + 1 &&
						b.order_path
							.slice(0, parent.order_path.length)
							.every((v, i) => v === parent.order_path[i])
				);
				const maxChild =
					children.length > 0
						? Math.max(...children.map((b) => b.order_path[parent.order_path.length] ?? 0))
						: 0;
				newOrderPath = [...parent.order_path, maxChild + 1];
			}
			const newBlock: Block = {
				id: `temp-${Date.now()}`,
				document_id: id,
				content: "",
				block_type: type,
				order_path: newOrderPath,
				created_by: "",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				updated_by: "",
			};
			setBlocks((prev) => [...prev, newBlock]);
			setChanges((prev) => [...prev, { action: "create", block: newBlock }]);
		} finally {
			setAdding(false);
		}
	};

	const handleBlockContentChange = (blockId: string, content: string) => {
		setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, content } : b)));
	};

	const handleUpdateBlock = (block: Block) => {
		setChanges((prev) => {
			const existing = prev.find((c) => c.block.id === block.id);
			return existing
				? prev.map((c) => (c.block.id === block.id ? { ...c, block } : c))
				: [...prev, { action: "update", block }];
		});
	};

	const handleDeleteBlock = (blockId: string) => {
		const block = blocks.find((b) => b.id === blockId);
		if (!block) return;
		setBlocks((prev) => prev.filter((b) => b.id !== blockId));
		setChanges((prev) => [...prev, { action: "delete", block }]);
	};

	if (loading) return <div className="document-editor-loading">Loading document…</div>;
	if (!document) return <div className="document-editor-notfound">Document not found.</div>;

	return (
		<DocumentLayout>
			<div className="document-editor">
				<header className="document-editor__header">
					<input
						className="document-editor__title-input"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Document title"
					/>
					<div className="document-editor__actions">
						<Button
							variant="secondary"
							size="small"
							onClick={() => navigate(`/documents/${id}`)}
							isFullWidth={false}
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							size="medium"
							onClick={() => setShowProposalForm(true)}
							isDisabled={changes.length === 0}
							isFullWidth={false}
						>
							Create Proposal
						</Button>
					</div>
				</header>

				<main className="document-editor__content">
					<div className="document-editor__blocks">
						{blocks.map((blk) => (
							<div key={blk.id} className="document-editor__block">
								<BlockView
									block={blk}
									isEditing
									onContentChange={handleBlockContentChange}
									onSave={handleUpdateBlock}
									onAddBlock={handleAddBlock}
									onDeleteBlock={handleDeleteBlock}
									isAdding={adding}
								/>
							</div>
						))}

						<div className="document-editor__add-end">
							<button
								type="button"
								className="document-editor__add-btn"
								onClick={() => setAddingAt("END")}
								disabled={adding}
							>
								+
							</button>
							{addingAt === "END" && (
								<div className="document-editor__add-menu">
									<button
										type="button"
										onClick={() => handleAddBlock(null, "text")}
										disabled={adding}
									>
										Text
									</button>
									<button
										type="button"
										onClick={() => handleAddBlock(null, "heading")}
										disabled={adding}
									>
										Heading
									</button>
									<button
										type="button"
										onClick={() => handleAddBlock(null, "code")}
										disabled={adding}
									>
										Code
									</button>
								</div>
							)}
						</div>
					</div>
				</main>

				<ProposalForm
					isOpen={showProposalForm}
					onClose={() => setShowProposalForm(false)}
					onSubmit={handleCreateProposal}
					isSubmitting={saving}
				/>
			</div>
		</DocumentLayout>
	);
};

export default DocumentEditorPage;
