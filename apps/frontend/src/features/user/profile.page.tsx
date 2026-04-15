import { ChevronRightIcon, DocumentTextIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/solid";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/features/auth/auth.api";
import { useAuth } from "@/features/auth/auth.context";
import { documentsApi } from "@/features/documents/documents.api";
import type { Document } from "@/features/documents/types";
import Button from "@/ui/button";
import Input from "@/ui/input";
import "./profile.page.scss";

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
	return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const ProfilePage: React.FC = () => {
	const { username, userId, updateUsername } = useAuth();
	const navigate = useNavigate();

	const [email, setEmail] = useState<string | null>(null);
	const [profileLoading, setProfileLoading] = useState(true);

	const [docs, setDocs] = useState<Document[]>([]);
	const [docsLoading, setDocsLoading] = useState(true);

	const [isEditing, setIsEditing] = useState(false);
	const [draftName, setDraftName] = useState(username ?? "");
	const [nameError, setNameError] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		authApi
			.getProfile()
			.then((p) => setEmail(p.email))
			.catch(() => {})
			.finally(() => setProfileLoading(false));

		documentsApi
			.getAll()
			.then((all) => {
				all.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
				setDocs(all.slice(0, 5));
			})
			.catch(() => {})
			.finally(() => setDocsLoading(false));
	}, []);

	const startEdit = () => {
		setDraftName(username ?? "");
		setNameError("");
		setIsEditing(true);
	};

	const cancelEdit = () => {
		setIsEditing(false);
		setNameError("");
	};

	const saveEdit = async () => {
		const trimmed = draftName.trim();
		if (!trimmed) {
			setNameError("Username cannot be empty.");
			return;
		}
		if (trimmed === username) {
			setIsEditing(false);
			return;
		}
		setSaving(true);
		setNameError("");
		try {
			await updateUsername(trimmed);
			setIsEditing(false);
		} catch {
			setNameError("Failed to save. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") void saveEdit();
		if (e.key === "Escape") cancelEdit();
	};

	return (
		<main className="profile-page">
			<header className="profile-page__header">
				<div>
					<h1 className="profile-page__title">Profile</h1>
					<p className="profile-page__subtitle">Manage your account and view recent activity.</p>
				</div>
				<div className="profile-page__header-actions">
					{isEditing ? (
						<>
							<Button variant="secondary" size="small" onClick={cancelEdit} isDisabled={saving}>
								<XMarkIcon style={{ width: 14, height: 14 }} />
								Cancel
							</Button>
							<Button variant="primary" size="small" onClick={saveEdit} isDisabled={saving}>
								{saving ? "Saving…" : "Save"}
							</Button>
						</>
					) : (
						<Button variant="secondary" size="small" onClick={startEdit}>
							<PencilIcon style={{ width: 14, height: 14 }} />
							Edit
						</Button>
					)}
				</div>
			</header>

			{/* Profile card */}
			<section className="profile-page__card" aria-labelledby="profile-name">
				<div className="profile-page__avatar" aria-hidden>
					<span className="profile-page__initials">{initialsFrom(username)}</span>
				</div>

				<div className="profile-page__info">
					{isEditing ? (
						<div className="profile-page__edit-field" onKeyDown={handleKeyDown}>
							<Input
								label="Username"
								value={draftName}
								onChange={setDraftName}
								hasError={!!nameError}
								errorMessage={nameError}
								isDisabled={saving}
							/>
						</div>
					) : (
						<div className="profile-page__name-row">
							<h2 id="profile-name" className="profile-page__name">
								{username ?? "Unknown"}
							</h2>
						</div>
					)}

					<div className="profile-page__meta">
						{profileLoading ? (
							<div className="profile-page__meta-skeleton" />
						) : (
							<span className="profile-page__email">{email ?? "Email not available"}</span>
						)}
						{userId && <span className="profile-page__id">ID · {userId.slice(0, 8)}</span>}
					</div>
				</div>
			</section>

			{/* Recent activity */}
			<section className="profile-page__activity" aria-labelledby="activity-heading">
				<h2 id="activity-heading" className="profile-page__section-title">
					Recent Activity
				</h2>

				{docsLoading ? (
					<div className="profile-page__doc-list">
						{Array.from({ length: 3 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
							<div key={i} className="profile-page__doc-skeleton" />
						))}
					</div>
				) : docs.length === 0 ? (
					<p className="profile-page__empty">No documents yet — create one to get started.</p>
				) : (
					<ul className="profile-page__doc-list">
						{docs.map((d) => (
							<li key={d.id}>
								<button
									type="button"
									className="profile-page__doc-row"
									onClick={() => navigate(`/documents/${d.id}`)}
									aria-label={`Open ${d.title}`}
								>
									<div className="profile-page__doc-icon">
										<DocumentTextIcon />
									</div>
									<div className="profile-page__doc-body">
										<span className="profile-page__doc-title">{d.title}</span>
										<span className="profile-page__doc-meta">Updated {timeAgo(d.updated_at)}</span>
									</div>
									<ChevronRightIcon className="profile-page__doc-arrow" />
								</button>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
};

export default ProfilePage;
