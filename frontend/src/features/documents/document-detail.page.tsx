import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProposalsView from "@/features/proposals/proposals-view";
import DocumentLayout from "@/layouts/document.layout";
import Button from "@/ui/button";
import BlockView from "./block";
import { blocksApi } from "./blocks.api";
import { documentsApi } from "./documents.api";
import type { Block, Document } from "./types";
import "./document-detail.page.scss";

const compareOrderPaths = (a: number[], b: number[]): number => {
	const len = Math.min(a.length, b.length);
	for (let i = 0; i < len; i++) {
		if (a[i] !== b[i]) return a[i] - b[i];
	}
	return a.length - b.length;
};

const formatDate = (s: string) =>
	new Date(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const DocumentDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [document, setDocument] = useState<Document | null>(null);
	const [blocks, setBlocks] = useState<Block[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		Promise.all([documentsApi.get(id), blocksApi.getAll(id).catch(() => [])])
			.then(([doc, blks]) => {
				setDocument(doc);
				setBlocks(
					(blks as Block[]).sort((a, b) =>
						compareOrderPaths(a.order_path ?? [], b.order_path ?? [])
					)
				);
			})
			.catch((err) => console.error("Failed to load document", err))
			.finally(() => setLoading(false));
	}, [id]);

	const handleDelete = async () => {
		if (!id || !confirm("Delete this document? This cannot be undone.")) return;
		try {
			await documentsApi.delete(id);
			navigate("/documents");
		} catch (err) {
			console.error("Failed to delete document", err);
		}
	};

	if (loading) return <div className="document-detail-loading">Loading document…</div>;
	if (!document) return <div className="document-detail-notfound">Document not found.</div>;

	return (
		<div className="document-detail-page">
			<div className="document-detail-page__main">
				<DocumentLayout>
					<div className="document-detail">
						<header className="document-detail__header">
							<div className="document-detail__title-group">
								<h1 className="document-detail__title">{document.title}</h1>
								<div className="document-detail__date">
									<span>Created {formatDate(document.created_at)}</span>
									{document.updated_at !== document.created_at && (
										<span>· Updated {formatDate(document.updated_at)}</span>
									)}
								</div>
							</div>
							<div className="document-detail__actions">
								<Button
									variant="secondary"
									size="small"
									onClick={() => navigate(`/documents/${document.id}/edit`)}
									isFullWidth={false}
								>
									Edit
								</Button>
								<Button variant="secondary" size="small" onClick={handleDelete} isFullWidth={false}>
									Delete
								</Button>
							</div>
						</header>

						<main className="document-detail__content">
							<div className="document-detail__blocks">
								{blocks.length === 0 ? (
									<p className="document-detail__empty">
										No content yet. Start editing to add blocks.
									</p>
								) : (
									blocks.map((blk) => <BlockView key={blk.id} block={blk} isEditing={false} />)
								)}
							</div>
						</main>
					</div>
				</DocumentLayout>
			</div>

			<div className="document-detail-page__sidebar">
				<ProposalsView documentId={document.id} />
			</div>
		</div>
	);
};

export default DocumentDetailPage;
