import { DocumentTextIcon, PlusIcon } from "@heroicons/react/24/solid";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentsApi } from "@/features/documents/documents.api";
import type { Document } from "@/features/documents/types";
import Button from "@/ui/button";
import Card from "@/ui/card";
import "./home.page.scss";

const relativeDate = (s: string) => {
	const days = Math.floor((Date.now() - new Date(s).getTime()) / 86_400_000);
	if (days === 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days} days ago`;
	return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const HomePage: React.FC = () => {
	const navigate = useNavigate();
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		documentsApi
			.getAll()
			.then((docs) =>
				setDocuments(
					docs
						.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
						.slice(0, 10)
				)
			)
			.catch((err) => console.error("Failed to load documents:", err))
			.finally(() => setLoading(false));
	}, []);

	const handleCreate = async () => {
		if (creating) return;
		setCreating(true);
		try {
			const res = await documentsApi.create("Untitled Document");
			if (res?.document_id) navigate(`/documents/${res.document_id}/edit`);
		} catch (err) {
			console.error("Failed to create document:", err);
		} finally {
			setCreating(false);
		}
	};

	return (
		<div className="home-page">
			<div className="home-page__container">
				<header className="home-page__header">
					<h1 className="home-page__title">Your workspace</h1>
					<p className="home-page__subtitle">Create, edit, and propose changes to documents.</p>
				</header>

				<main className="home-page__content">
					<div className="home-page__actions">
						<Button
							variant="primary"
							size="medium"
							onClick={handleCreate}
							isDisabled={creating}
							isFullWidth={false}
						>
							<PlusIcon style={{ width: 16, height: 16 }} />
							{creating ? "Creating…" : "New Document"}
						</Button>
						<Button
							variant="secondary"
							size="medium"
							onClick={() => navigate("/documents")}
							isFullWidth={false}
						>
							All Documents
						</Button>
					</div>

					<section className="home-page__documents">
						<div className="home-page__section-header">
							<h2 className="home-page__section-title">Recent Documents</h2>
						</div>

						{loading ? (
							<div className="home-page__skeleton-grid">
								{Array.from({ length: 6 }).map((_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable identity
									<div key={i} className="home-page__skeleton-card" />
								))}
							</div>
						) : documents.length === 0 ? (
							<div className="home-page__empty">
								<DocumentTextIcon className="home-page__empty-icon" />
								<h3 className="home-page__empty-title">No documents yet</h3>
								<p className="home-page__empty-text">Create your first document to get started.</p>
								<Button
									variant="primary"
									size="medium"
									onClick={handleCreate}
									isDisabled={creating}
								>
									<PlusIcon style={{ width: 16, height: 16 }} />
									Create Document
								</Button>
							</div>
						) : (
							<div className="home-page__documents-grid">
								{documents.map((doc) => (
									<Card
										key={doc.id}
										variant="default"
										padding="md"
										onClick={() => navigate(`/documents/${doc.id}`)}
										className="home-page__document-card"
									>
										<div className="home-page__document-icon">
											<DocumentTextIcon />
										</div>
										<h3 className="home-page__document-title">{doc.title}</h3>
										<p className="home-page__document-meta">
											{relativeDate(doc.updated_at || doc.created_at)}
										</p>
									</Card>
								))}
							</div>
						)}
					</section>
				</main>
			</div>
		</div>
	);
};

export default HomePage;
