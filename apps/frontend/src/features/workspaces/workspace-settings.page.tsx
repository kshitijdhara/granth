import {
	ArrowLeftIcon,
	TrashIcon,
	UserMinusIcon,
	UserPlusIcon,
} from "@heroicons/react/24/solid";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/features/auth/auth.context";
import Button from "@/ui/button";
import Input from "@/ui/input";
import { useWorkspace } from "./workspace.context";
import type { WorkspaceMember, WorkspaceRole } from "./types";
import { workspacesApi } from "./workspaces.api";
import "./workspace-settings.page.scss";

const ROLES: WorkspaceRole[] = ["admin", "reviewer", "contributor"];

const roleBadgeClass = (role: WorkspaceRole) => {
	if (role === "admin") return "ws-settings__badge ws-settings__badge--admin";
	if (role === "reviewer") return "ws-settings__badge ws-settings__badge--reviewer";
	return "ws-settings__badge ws-settings__badge--contributor";
};

const WorkspaceSettingsPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { userId } = useAuth();
	const { workspaces, current, refresh, setCurrent } = useWorkspace();

	const workspace = workspaces.find((w) => w.id === id) ?? current;

	const [members, setMembers] = useState<WorkspaceMember[]>([]);
	const [loadingMembers, setLoadingMembers] = useState(false);

	// Edit name/description
	const [name, setName] = useState(workspace?.name ?? "");
	const [description, setDescription] = useState(workspace?.description ?? "");
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Add member
	const [addUserId, setAddUserId] = useState("");
	const [addRole, setAddRole] = useState<WorkspaceRole>("contributor");
	const [adding, setAdding] = useState(false);
	const [addError, setAddError] = useState<string | null>(null);

	// Delete workspace
	const [deleting, setDeleting] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		if (workspace) {
			setName(workspace.name);
			setDescription(workspace.description);
		}
	}, [workspace]);

	useEffect(() => {
		if (!id) return;
		setLoadingMembers(true);
		workspacesApi
			.getMembers(id)
			.then(setMembers)
			.catch(console.error)
			.finally(() => setLoadingMembers(false));
	}, [id]);

	const isAdmin = members.some((m) => m.user_id === userId && m.role === "admin");
	const isOwner = workspace?.owner_id === userId;

	const handleSave = async () => {
		if (!id || !name.trim() || saving) return;
		setSaving(true);
		setSaveError(null);
		try {
			await workspacesApi.update(id, name.trim(), description.trim());
			await refresh();
		} catch (err) {
			setSaveError(err instanceof Error ? err.message : "Failed to save");
		} finally {
			setSaving(false);
		}
	};

	const handleAddMember = async () => {
		if (!id || !addUserId.trim() || adding) return;
		setAdding(true);
		setAddError(null);
		try {
			const member = await workspacesApi.addMember(id, addUserId.trim(), addRole);
			setMembers((prev) => [...prev, member]);
			setAddUserId("");
		} catch (err) {
			setAddError(err instanceof Error ? err.message : "Failed to add member");
		} finally {
			setAdding(false);
		}
	};

	const handleRoleChange = async (member: WorkspaceMember, role: WorkspaceRole) => {
		if (!id) return;
		try {
			await workspacesApi.updateMemberRole(id, member.user_id, role);
			setMembers((prev) => prev.map((m) => (m.user_id === member.user_id ? { ...m, role } : m)));
		} catch (err) {
			console.error("Failed to update role:", err);
		}
	};

	const handleRemoveMember = async (member: WorkspaceMember) => {
		if (!id) return;
		try {
			await workspacesApi.removeMember(id, member.user_id);
			setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
		} catch (err) {
			console.error("Failed to remove member:", err);
		}
	};

	const handleDelete = async () => {
		if (!id || deleting) return;
		setDeleting(true);
		try {
			await workspacesApi.delete(id);
			await refresh();
			// If we deleted the current workspace, clear it
			if (current?.id === id) {
				const remaining = workspaces.filter((w) => w.id !== id);
				if (remaining[0]) setCurrent(remaining[0].id);
			}
			navigate("/group");
		} catch (err) {
			console.error("Failed to delete workspace:", err);
		} finally {
			setDeleting(false);
			setConfirmDelete(false);
		}
	};

	if (!workspace) {
		return (
			<div className="ws-settings">
				<p className="ws-settings__not-found">Workspace not found.</p>
			</div>
		);
	}

	return (
		<div className="ws-settings">
			<header className="ws-settings__header">
				<button
					type="button"
					className="ws-settings__back"
					onClick={() => navigate("/group")}
					aria-label="Back to workspaces"
				>
					<ArrowLeftIcon style={{ width: 16, height: 16 }} />
					Workspaces
				</button>
				<h1 className="ws-settings__heading">{workspace.name}</h1>
				<p className="ws-settings__subheading">Settings</p>
			</header>

			{/* Details section — admin only */}
			{isAdmin && (
				<section className="ws-settings__section">
					<h2 className="ws-settings__section-title">Details</h2>
					<div className="ws-settings__fields">
						<Input label="Name" value={name} onChange={setName} isRequired />
						<Input label="Description" value={description} onChange={setDescription} />
					</div>
					{saveError && <p className="ws-settings__error">{saveError}</p>}
					<Button
						variant="primary"
						size="medium"
						onClick={handleSave}
						isDisabled={saving || !name.trim()}
						isFullWidth={false}
					>
						{saving ? "Saving…" : "Save changes"}
					</Button>
				</section>
			)}

			{/* Members section */}
			<section className="ws-settings__section">
				<h2 className="ws-settings__section-title">Members</h2>

				{isAdmin && (
					<div className="ws-settings__add-member">
						<Input
							label="User ID"
							placeholder="Paste a user ID to add"
							value={addUserId}
							onChange={setAddUserId}
						/>
						<div className="ws-settings__role-select-row">
							<label className="ws-settings__role-label">Role</label>
							<select
								className="ws-settings__role-select"
								value={addRole}
								onChange={(e) => setAddRole(e.target.value as WorkspaceRole)}
							>
								{ROLES.map((r) => (
									<option key={r} value={r}>
										{r.charAt(0).toUpperCase() + r.slice(1)}
									</option>
								))}
							</select>
						</div>
						{addError && <p className="ws-settings__error">{addError}</p>}
						<Button
							variant="primary"
							size="medium"
							onClick={handleAddMember}
							isDisabled={adding || !addUserId.trim()}
							isFullWidth={false}
						>
							<UserPlusIcon style={{ width: 16, height: 16 }} />
							{adding ? "Adding…" : "Add member"}
						</Button>
					</div>
				)}

				{loadingMembers ? (
					<div className="ws-settings__member-loading">
						{Array.from({ length: 3 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeletons
							<div key={i} className="ws-settings__member-skeleton" />
						))}
					</div>
				) : (
					<ul className="ws-settings__member-list">
						{members.map((m) => (
							<li key={m.user_id} className="ws-settings__member-item">
								<div className="ws-settings__member-info">
									<span className="ws-settings__member-name">{m.username}</span>
									<span className={roleBadgeClass(m.role as WorkspaceRole)}>{m.role}</span>
								</div>
								{isAdmin && m.user_id !== userId && (
									<div className="ws-settings__member-actions">
										<select
											className="ws-settings__role-select ws-settings__role-select--inline"
											value={m.role}
											onChange={(e) =>
												handleRoleChange(m, e.target.value as WorkspaceRole)
											}
										>
											{ROLES.map((r) => (
												<option key={r} value={r}>
													{r.charAt(0).toUpperCase() + r.slice(1)}
												</option>
											))}
										</select>
										<button
											type="button"
											className="ws-settings__remove-btn"
											onClick={() => handleRemoveMember(m)}
											title={`Remove ${m.username}`}
											aria-label={`Remove ${m.username}`}
										>
											<UserMinusIcon style={{ width: 14, height: 14 }} />
										</button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</section>

			{/* Danger zone — owner only */}
			{isOwner && (
				<section className="ws-settings__section ws-settings__section--danger">
					<h2 className="ws-settings__section-title ws-settings__section-title--danger">
						Danger zone
					</h2>
					{!confirmDelete ? (
						<Button
							variant="secondary"
							size="medium"
							onClick={() => setConfirmDelete(true)}
							isFullWidth={false}
						>
							<TrashIcon style={{ width: 14, height: 14 }} />
							Delete workspace
						</Button>
					) : (
						<div className="ws-settings__confirm-delete">
							<p className="ws-settings__confirm-text">
								Delete <strong>{workspace.name}</strong>? All documents in this workspace will also be
								deleted. This cannot be undone.
							</p>
							<div className="ws-settings__confirm-actions">
								<Button
									variant="secondary"
									size="medium"
									onClick={() => setConfirmDelete(false)}
									isFullWidth={false}
								>
									Cancel
								</Button>
								<Button
									variant="primary"
									size="medium"
									onClick={handleDelete}
									isDisabled={deleting}
									isFullWidth={false}
								>
									{deleting ? "Deleting…" : "Yes, delete it"}
								</Button>
							</div>
						</div>
					)}
				</section>
			)}
		</div>
	);
};

export default WorkspaceSettingsPage;
