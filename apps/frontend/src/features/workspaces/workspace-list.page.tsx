import { BuildingOffice2Icon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/ui/button";
import Input from "@/ui/input";
import { useWorkspace } from "./workspace.context";
import { workspacesApi } from "./workspaces.api";
import "./workspace-list.page.scss";

const WorkspaceListPage: React.FC = () => {
	const navigate = useNavigate();
	const { workspaces, loading, setCurrent, refresh } = useWorkspace();

	const [creating, setCreating] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState<string | null>(null);

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
				<div className="workspaces-page__form">
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
						<Button variant="secondary" size="medium" onClick={() => setShowForm(false)} isFullWidth={false}>
							Cancel
						</Button>
						<Button
							variant="primary"
							size="medium"
							onClick={handleCreate}
							isDisabled={creating || !name.trim()}
							isFullWidth={false}
						>
							{creating ? "Creating…" : "Create"}
						</Button>
					</div>
				</div>
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
					<div className="workspaces-page__empty">
						<BuildingOffice2Icon className="workspaces-page__empty-icon" />
						<p>No workspaces yet — create one to start collaborating.</p>
					</div>
				) : (
					<ul className="workspaces-page__list">
						{workspaces.map((ws) => (
							<li key={ws.id} className="workspaces-page__item">
								<button
									type="button"
									className="workspaces-page__link"
									onClick={() => handleSelect(ws.id)}
									aria-label={`Open ${ws.name}`}
								>
									<div className="workspaces-page__link-icon">
										<BuildingOffice2Icon />
									</div>
									<div className="workspaces-page__link-body">
										<div className="workspaces-page__name">{ws.name}</div>
										{ws.description && (
											<div className="workspaces-page__desc">{ws.description}</div>
										)}
									</div>
									<ChevronRightIcon className="workspaces-page__link-arrow" />
								</button>
							</li>
						))}
					</ul>
				)}
			</main>
		</div>
	);
};

export default WorkspaceListPage;
