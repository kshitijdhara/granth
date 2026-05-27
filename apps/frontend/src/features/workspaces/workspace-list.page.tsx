import { ChevronRightIcon, PlusIcon } from "@heroicons/react/24/solid";
import gsap from "gsap";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/ui/avatar";
import Button from "@/ui/button";
import Card from "@/ui/card";
import EmptyState from "@/ui/empty-state";
import Input from "@/ui/input";
import { useWorkspace } from "./workspace.context";
import { workspacesApi } from "./workspaces.api";
import "./workspace-list.page.scss";

const WorkspaceListPage: React.FC = () => {
	const navigate = useNavigate();
	const { workspaces, loading, setCurrent, refresh } = useWorkspace();
	const cardsRef = useRef<HTMLDivElement>(null);

	const [creating, setCreating] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState<string | null>(null);

	// Animate cards on mount
	React.useEffect(() => {
		if (cardsRef.current && !loading && workspaces.length > 0) {
			const cards = cardsRef.current.querySelectorAll(".workspace-card");
			gsap.from(cards, {
				opacity: 0,
				y: 12,
				stagger: 0.04,
				duration: 0.4,
				ease: "power2.out",
			});
		}
	}, [loading, workspaces.length]);

	const handleCreate = async () => {
		if (!name.trim() || creating) return;
		setCreating(true);
		setError(null);
		try {
			const ws = await workspacesApi.create(name.trim(), description.trim());
			await refresh();
			setCurrent(ws.id);
			navigate("/inbox");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create workspace");
		} finally {
			setCreating(false);
		}
	};

	const handleSelect = (id: string) => {
		setCurrent(id);
		navigate("/inbox");
	};

	return (
		<div className="workspaces-page">
			<header className="workspaces-page__header">
				<h1 className="workspaces-page__heading">Workspaces</h1>
				<Button
					variant="primary"
					size="medium"
					onClick={() => setShowForm((v) => !v)}
					isFullWidth={false}
				>
					<PlusIcon style={{ width: 16, height: 16 }} />
					New Workspace
				</Button>
			</header>

			{showForm && (
				<Card variant="glass" padding="lg" className="workspaces-page__form">
					<h2 className="workspaces-page__form-title">Create a workspace</h2>
					<Input
						label="Name"
						placeholder="e.g. Backend Platform, Legal Review, Q3 Research"
						value={name}
						onChange={setName}
						isRequired
					/>
					<Input
						label="Description (optional)"
						placeholder="What does this workspace hold?"
						value={description}
						onChange={setDescription}
					/>
					{error && <p className="workspaces-page__error">{error}</p>}
					<div className="workspaces-page__form-actions">
						<Button variant="secondary" onClick={() => setShowForm(false)}>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleCreate}
							disabled={creating || !name.trim()}
						>
							{creating ? "Creating…" : "Create"}
						</Button>
					</div>
				</Card>
			)}

			<main className="workspaces-page__content">
				{loading ? (
					<div className="workspaces-page__loading">
						{Array.from({ length: 3 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
							<div key={i} className="workspaces-page__skeleton" />
						))}
					</div>
				) : workspaces.length === 0 ? (
					<EmptyState
						heading="No workspaces yet"
						description="Create one to start collaborating with your team."
						cta={{
							label: "Create a workspace",
							onClick: () => setShowForm(true),
						}}
					/>
				) : (
					<div className="workspaces-page__grid" ref={cardsRef}>
						{workspaces.map((ws) => (
							<Card
								key={ws.id}
								variant="glass"
								padding="md"
								onClick={() => handleSelect(ws.id)}
								className="workspace-card"
							>
								<div className="workspace-card__content">
									<div className="workspace-card__header">
										<Avatar
											initials={(ws.name[0] ?? "W").toUpperCase()}
											name={ws.name}
											size="sm"
										/>
										<div className="workspace-card__title-col">
											<h3 className="workspace-card__name">{ws.name}</h3>
											{ws.description && (
												<p className="workspace-card__desc">{ws.description}</p>
											)}
										</div>
									</div>
									<ChevronRightIcon className="workspace-card__arrow" />
								</div>
							</Card>
						))}
					</div>
				)}
			</main>
		</div>
	);
};

export default WorkspaceListPage;
