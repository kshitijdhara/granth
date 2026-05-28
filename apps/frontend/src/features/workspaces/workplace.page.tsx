import {
	BuildingOffice2Icon,
	CalendarDaysIcon,
	DocumentTextIcon,
	ShieldCheckIcon,
	UserMinusIcon,
	UserPlusIcon,
	UsersIcon,
} from "@heroicons/react/24/solid";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth.context";
import Button from "@/ui/button";
import Input from "@/ui/input";
import { useWorkspace } from "./workspace.context";
import type { WorkspaceMember, WorkspaceRole } from "./types";
import type { GovernanceConfig } from "./workspaces.api";
import { workspacesApi } from "./workspaces.api";
import type { Document } from "@/features/documents/types";
import "./workplace.page.scss";

type TabId = "overview" | "members" | "documents" | "settings";

const initialsFrom = (name?: string | null) => {
	if (!name) return "U";
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
	return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
};

const timeAgo = (dateStr: string): string => {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const WorkplacePage: React.FC = () => {
	const navigate = useNavigate();
	const { current: workspace, workspaces } = useWorkspace();
	const { userId } = useAuth();
	const [tab, setTab] = useState<TabId>("overview");

	const [members, setMembers] = useState<WorkspaceMember[]>([]);
	const [membersLoading, setMembersLoading] = useState(false);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [docsLoading, setDocsLoading] = useState(false);
	const [governance, setGovernance] = useState<GovernanceConfig | null>(null);

	const [addUserId, setAddUserId] = useState("");
	const [addRole, setAddRole] = useState<WorkspaceRole>("contributor");
	const [adding, setAdding] = useState(false);
	const [addError, setAddError] = useState("");

	const [editName, setEditName] = useState(workspace?.name ?? "");
	const [editDescription, setEditDescription] = useState(workspace?.description ?? "");
	const [savingDetails, setSavingDetails] = useState(false);
	const [detailsError, setDetailsError] = useState("");

	const [govMinReviewers, setGovMinReviewers] = useState(1);
	const [govAllowAuthorReview, setGovAllowAuthorReview] = useState(false);
	const [savingGov, setSavingGov] = useState(false);
	const [govError, setGovError] = useState("");

	const [deleting, setDeleting] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const isAdmin = members.some((m) => m.user_id === userId && m.role === "admin");
	const isOwner = workspace?.owner_id === userId;
	const isOnlyWorkspace = workspaces.length <= 1;

	useEffect(() => {
		if (!workspace) return;
		setEditName(workspace.name);
		setEditDescription(workspace.description);
	}, [workspace]);

	useEffect(() => {
		if (!workspace) return;
		setMembersLoading(true);
		workspacesApi
			.getMembers(workspace.id)
			.then(setMembers)
			.catch(console.error)
			.finally(() => setMembersLoading(false));
	}, [workspace]);

	useEffect(() => {
		if (!workspace) return;
		setDocsLoading(true);
		workspacesApi
			.getDocuments(workspace.id)
			.then((docs) => {
				setDocuments([...docs].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
			})
			.catch(console.error)
			.finally(() => setDocsLoading(false));
	}, [workspace]);

	useEffect(() => {
		if (!workspace) return;
		workspacesApi
			.getGovernance(workspace.id)
			.then((g) => {
				setGovernance(g);
				setGovMinReviewers(g.min_reviewers ?? 1);
				setGovAllowAuthorReview(g.allow_author_review ?? false);
			})
			.catch(() => {});
	}, [workspace]);

	const handleAddMember = async () => {
		if (!workspace || !addUserId.trim()) {
			setAddError("User ID is required");
			return;
		}
		setAdding(true);
		setAddError("");
		try {
			await workspacesApi.addMember(workspace.id, addUserId.trim(), addRole);
			setAddUserId("");
			setAddRole("contributor");
			const updated = await workspacesApi.getMembers(workspace.id);
			setMembers(updated);
		} catch (err) {
			setAddError(err instanceof Error ? err.message : "Failed to add member");
		} finally {
			setAdding(false);
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		if (!workspace) return;
		try {
			await workspacesApi.removeMember(workspace.id, memberId);
			setMembers((prev) => prev.filter((m) => m.user_id !== memberId));
		} catch (err) {
			console.error("Failed to remove member:", err);
		}
	};

	const handleUpdateMemberRole = async (member: WorkspaceMember, newRole: WorkspaceRole) => {
		if (!workspace) return;
		try {
			await workspacesApi.updateMemberRole(workspace.id, member.user_id, newRole);
			setMembers((prev) => prev.map((m) => (m.user_id === member.user_id ? { ...m, role: newRole } : m)));
		} catch (err) {
			console.error("Failed to update role:", err);
		}
	};

	const handleSaveDetails = async () => {
		if (!workspace || !editName.trim()) {
			setDetailsError("Name is required");
			return;
		}
		setSavingDetails(true);
		setDetailsError("");
		try {
			await workspacesApi.update(workspace.id, editName.trim(), editDescription);
		} catch (err) {
			setDetailsError(err instanceof Error ? err.message : "Failed to save");
		} finally {
			setSavingDetails(false);
		}
	};

	const handleSaveGovernance = async () => {
		if (!workspace) return;
		setSavingGov(true);
		setGovError("");
		try {
			const updated = await workspacesApi.setGovernance(workspace.id, {
				workspace_id: workspace.id,
				min_reviewers: govMinReviewers,
				allow_author_review: govAllowAuthorReview,
				require_role: governance?.require_role ?? null,
			});
			setGovernance(updated);
		} catch (err) {
			setGovError(err instanceof Error ? err.message : "Failed to save policy");
		} finally {
			setSavingGov(false);
		}
	};

	const handleDelete = async () => {
		if (!workspace || deleting) return;
		setDeleting(true);
		try {
			await workspacesApi.delete(workspace.id);
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
			<div className="workplace">
				<div className="workplace__empty-state">
					<p className="workplace__empty-text">Select or create a workspace to get started.</p>
				</div>
			</div>
		);
	}

	return (
		<main className="workplace">
			<header className="workplace__header">
				<div className="workplace__header-text">
					<div className="workplace__title-row">
						<BuildingOffice2Icon style={{ width: 28, height: 28 }} />
						<h1 className="workplace__title">{workspace.name}</h1>
					</div>
					<p className="workplace__stat-row">
						{members.length} member{members.length !== 1 ? "s" : ""} · {documents.length} document
						{documents.length !== 1 ? "s" : ""}
					</p>
				</div>
			</header>

			<nav className="workplace__tabs">
				{(["overview", "members", "documents", "settings"] as const).map((t) => (
					<button
						key={t}
						type="button"
						className={`workplace__tab-btn ${tab === t ? "workplace__tab-btn--active" : ""}`}
						onClick={() => setTab(t)}
					>
						{t.charAt(0).toUpperCase() + t.slice(1)}
					</button>
				))}
			</nav>

			<div className="workplace__content">
				{/* Overview Tab */}
				{tab === "overview" && (
					<>
						{/* Identity Card */}
						<section className="workplace__section workplace__identity">
							<div className="workplace__identity-icon">
								<BuildingOffice2Icon />
							</div>
							<div className="workplace__identity-body">
								<h2 className="workplace__identity-name">{workspace.name}</h2>
								<p className={`workplace__identity-description ${!workspace.description ? "workplace__identity-description--empty" : ""}`}>
									{workspace.description || "No description yet"}
								</p>
								<div className="workplace__identity-chips">
									{/* Owner Chip */}
									<span className="workplace__chip workplace__chip--owner">
										<span className="workplace__chip-avatar">
											{initialsFrom(members.find((m) => m.user_id === workspace.owner_id)?.username)}
										</span>
										<span className="workplace__chip-label">
											{members.find((m) => m.user_id === workspace.owner_id)?.username ?? "Unknown"}
										</span>
										<span className="workplace__chip-role">owner</span>
									</span>
									{/* Created Date Chip */}
									<span className="workplace__chip">
										<CalendarDaysIcon style={{ width: 14, height: 14 }} />
										{new Date(workspace.created_at).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</span>
								</div>
							</div>
						</section>

						{/* Stats Strip */}
						<div className="workplace__stats">
							<div className="workplace__stat-pill">
								<UsersIcon style={{ width: 14, height: 14 }} />
								<strong>{members.length}</strong> {members.length === 1 ? "member" : "members"}
							</div>
							<div className="workplace__stat-pill">
								<DocumentTextIcon style={{ width: 14, height: 14 }} />
								<strong>{documents.length}</strong> {documents.length === 1 ? "document" : "documents"}
							</div>
							{governance?.min_reviewers && (
								<div className="workplace__stat-pill">
									<ShieldCheckIcon style={{ width: 14, height: 14 }} />
									<strong>{governance.min_reviewers}</strong> min reviewer{governance.min_reviewers !== 1 ? "s" : ""}
								</div>
							)}
						</div>

						{/* Documents Card */}
						<section className="workplace__section">
							<div className="workplace__section-header">
								<h2 className="workplace__section-title">Recently Updated</h2>
								{documents.length > 3 && (
									<button
										type="button"
										className="workplace__section-action"
										onClick={() => setTab("documents")}
									>
										See all →
									</button>
								)}
							</div>

							{docsLoading ? (
								<div className="workplace__loading">
									{Array.from({ length: 3 }).map((_, i) => (
										<div key={i} className="workplace__skeleton-row">
											<div className="workplace__skeleton" style={{ width: 20, height: 20, borderRadius: "50%" }} />
											<div className="workplace__skeleton" style={{ flex: 1 }} />
										</div>
									))}
								</div>
							) : documents.length === 0 ? (
								<div className="workplace__empty-documents">
									<DocumentTextIcon style={{ width: 32, height: 32, opacity: 0.4 }} />
									<p className="workplace__empty-title">No documents yet</p>
									<p className="workplace__empty-text">Your workspace doesn't have any documents. Create one to get started.</p>
									<button
										type="button"
										className="workplace__form-button"
										onClick={() => navigate("/truth")}
									>
										Create first document
									</button>
								</div>
							) : (
								<ul className="workplace__doc-list">
									{documents.slice(0, 3).map((doc) => (
										<li key={doc.id}>
											<button
												type="button"
												className="workplace__doc-row"
												onClick={() => navigate(`/truth/${doc.id}`)}
											>
												<DocumentTextIcon style={{ width: 18, height: 18 }} />
												<div className="workplace__doc-info">
													<span className="workplace__doc-title">{doc.title || "Untitled"}</span>
													<span className="workplace__doc-meta">Updated {timeAgo(doc.updated_at)}</span>
												</div>
											</button>
										</li>
									))}
								</ul>
							)}
						</section>
					</>
				)}

				{/* Members Tab */}
				{tab === "members" && (
					<>
						{isAdmin && (
							<section className="workplace__section">
								<h2 className="workplace__section-title">Add Member</h2>
								<div className="workplace__form-row">
									<Input
										label="User ID"
										value={addUserId}
										onChange={setAddUserId}
										placeholder="Paste a user ID"
										isDisabled={adding}
										hasError={!!addError}
										errorMessage={addError}
									/>
									<div className="workplace__form-group">
										<label className="workplace__label" htmlFor="add-role">
											Role
										</label>
										<select
											id="add-role"
											className="workplace__select"
											value={addRole}
											onChange={(e) => setAddRole(e.target.value as WorkspaceRole)}
											disabled={adding}
										>
											<option value="contributor">Contributor</option>
											<option value="reviewer">Reviewer</option>
											<option value="admin">Admin</option>
										</select>
									</div>
									<Button
										variant="primary"
										size="medium"
										onClick={handleAddMember}
										isDisabled={adding || !addUserId.trim()}
									>
										<UserPlusIcon style={{ width: 16, height: 16 }} />
										{adding ? "Adding..." : "Add"}
									</Button>
								</div>
							</section>
						)}

						<section className="workplace__section">
							<h2 className="workplace__section-title">Members</h2>
							{membersLoading ? (
								<div className="workplace__member-skeleton" />
							) : members.length === 0 ? (
								<p className="workplace__empty-text">No members yet.</p>
							) : (
								<ul className="workplace__member-list">
									{members.map((member) => (
										<li key={member.user_id} className="workplace__member-item">
											<div className="workplace__member-info">
												<div className="workplace__member-avatar">{initialsFrom(member.username)}</div>
												<div className="workplace__member-text">
													<span className="workplace__member-name">{member.username}</span>
													<span className={`workplace__role-badge workplace__role-badge--${member.role}`}>
														{member.role.charAt(0).toUpperCase() + member.role.slice(1)}
													</span>
												</div>
											</div>
											{isAdmin && member.user_id !== userId && (
												<div className="workplace__member-actions">
													<select
														className="workplace__select workplace__select--inline"
														value={member.role}
														onChange={(e) => handleUpdateMemberRole(member, e.target.value as WorkspaceRole)}
													>
														<option value="contributor">Contributor</option>
														<option value="reviewer">Reviewer</option>
														<option value="admin">Admin</option>
													</select>
													<button
														type="button"
														className="workplace__remove-btn"
														onClick={() => handleRemoveMember(member.user_id)}
														title={`Remove ${member.username}`}
														aria-label={`Remove ${member.username}`}
													>
														<UserMinusIcon style={{ width: 16, height: 16 }} />
													</button>
												</div>
											)}
										</li>
									))}
								</ul>
							)}
						</section>
					</>
				)}

				{/* Documents Tab */}
				{tab === "documents" && (
					<section className="workplace__section">
						<h2 className="workplace__section-title">Documents</h2>
						{docsLoading ? (
							<div className="workplace__doc-skeleton" />
						) : documents.length === 0 ? (
							<p className="workplace__empty-text">No documents in this workspace yet. Create one in the Library.</p>
						) : (
							<ul className="workplace__doc-list">
								{documents.map((doc) => (
									<li key={doc.id}>
										<button
											type="button"
											className="workplace__doc-row"
											onClick={() => navigate(`/truth/${doc.id}`)}
										>
											<DocumentTextIcon style={{ width: 18, height: 18 }} />
											<div className="workplace__doc-info">
												<span className="workplace__doc-title">{doc.title}</span>
												<span className="workplace__doc-meta">Updated {timeAgo(doc.updated_at)}</span>
											</div>
										</button>
									</li>
								))}
							</ul>
						)}
					</section>
				)}

				{/* Settings Tab */}
				{tab === "settings" && (
					<>
						{isAdmin && (
							<section className="workplace__section">
								<h2 className="workplace__section-title">Details</h2>
								<div className="workplace__form-group">
									<Input
										label="Name"
										value={editName}
										onChange={setEditName}
										isDisabled={savingDetails}
										hasError={!!detailsError}
										errorMessage={detailsError}
									/>
								</div>
								<div className="workplace__form-group">
									<Input label="Description" value={editDescription} onChange={setEditDescription} />
								</div>
								<Button variant="primary" size="medium" onClick={handleSaveDetails} isDisabled={savingDetails}>
									{savingDetails ? "Saving…" : "Save changes"}
								</Button>
							</section>
						)}

						{isAdmin && (
							<section className="workplace__section">
								<h2 className="workplace__section-title">Review Policy</h2>
								<div className="workplace__form-group">
									<label className="workplace__label" htmlFor="min-reviewers">
										Minimum approvals required
									</label>
									<input
										id="min-reviewers"
										type="number"
										className="workplace__number-input"
										min={1}
										max={10}
										value={govMinReviewers}
										onChange={(e) => setGovMinReviewers(Math.max(1, Number(e.target.value)))}
										disabled={savingGov}
									/>
								</div>
								<div className="workplace__form-group">
									<label className="workplace__checkbox-label">
										<input
											type="checkbox"
											checked={govAllowAuthorReview}
											onChange={(e) => setGovAllowAuthorReview(e.target.checked)}
											disabled={savingGov}
										/>
										Allow authors to approve their own proposals
									</label>
								</div>
								{govError && <p className="workplace__error">{govError}</p>}
								<Button variant="primary" size="medium" onClick={handleSaveGovernance} isDisabled={savingGov}>
									{savingGov ? "Saving…" : "Save policy"}
								</Button>
							</section>
						)}

						{isOwner && (
							<section className="workplace__section workplace__section--danger">
								<h2 className="workplace__section-title workplace__section-title--danger">Danger Zone</h2>
								{!confirmDelete ? (
									<>
										<Button
											variant="secondary"
											size="medium"
											onClick={() => setConfirmDelete(true)}
											isDisabled={isOnlyWorkspace}
										>
											Delete Workspace
										</Button>
										{isOnlyWorkspace && <p className="workplace__danger-note">You must keep at least one workspace.</p>}
									</>
								) : (
									<div className="workplace__confirm-delete">
										<p className="workplace__confirm-text">
											Delete <strong>{workspace.name}</strong>? All documents in this workspace will also be deleted.
											This cannot be undone.
										</p>
										<div className="workplace__confirm-actions">
											<Button
												variant="secondary"
												size="medium"
												onClick={() => setConfirmDelete(false)}
												isDisabled={deleting}
											>
												Cancel
											</Button>
											<Button
												variant="primary"
												size="medium"
												onClick={handleDelete}
												isDisabled={deleting}
											>
												{deleting ? "Deleting…" : "Yes, delete it"}
											</Button>
										</div>
									</div>
								)}
							</section>
						)}
					</>
				)}
			</div>
		</main>
	);
};

export default WorkplacePage;
