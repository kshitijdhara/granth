import { LockClosedIcon } from "@heroicons/react/24/solid";
import type React from "react";
import { useEffect, useState } from "react";
import Button from "@/ui/button";
import { type Comment, commentsApi } from "./comments.api";
import "./comment-thread.scss";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRelative = (iso: string): string => {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 60) return `${Math.max(1, mins)}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	return `${days}d ago`;
};

const wasEdited = (c: Comment): boolean => c.created_at !== c.updated_at;

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CommentItemProps {
	comment: Comment;
	replies: Comment[];
	currentUserId: string | null;
	isSealed: boolean;
	onReply: (parentId: string) => void;
	onDelete: (id: string) => void;
	onUpdate: (id: string, body: string) => void;
	replyingTo: string | null;
	replyBody: string;
	onReplyBodyChange: (v: string) => void;
	onReplySubmit: () => void;
	onReplyCancel: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
	comment,
	replies,
	currentUserId,
	isSealed,
	onReply,
	onDelete,
	onUpdate,
	replyingTo,
	replyBody,
	onReplyBodyChange,
	onReplySubmit,
	onReplyCancel,
}) => {
	const [editing, setEditing] = useState(false);
	const [editBody, setEditBody] = useState(comment.body);
	const isOwn = comment.author_id === currentUserId;

	const handleEditSave = () => {
		if (!editBody.trim()) return;
		onUpdate(comment.id, editBody.trim());
		setEditing(false);
	};

	return (
		<div className="comment-thread__item">
			<div className="comment-thread__item-header">
				<span className="comment-thread__item-author">{comment.author_username}</span>
				<span className="comment-thread__item-time">{formatRelative(comment.created_at)}</span>
				{wasEdited(comment) && (
					<span className="comment-thread__item-edited">edited</span>
				)}
			</div>

			{editing ? (
				<div className="comment-thread__edit-form">
					<textarea
						className="comment-thread__textarea"
						value={editBody}
						onChange={(e) => setEditBody(e.target.value)}
						autoFocus
					/>
					<div className="comment-thread__edit-actions">
						<Button size="small" onClick={handleEditSave} isDisabled={!editBody.trim()}>
							Save
						</Button>
						<Button size="small" variant="secondary" onClick={() => { setEditing(false); setEditBody(comment.body); }}>
							Cancel
						</Button>
					</div>
				</div>
			) : (
				<p className="comment-thread__item-body">{comment.body}</p>
			)}

			{!editing && (
				<div className="comment-thread__item-actions">
					{!isSealed && (
						<button
							type="button"
							className="comment-thread__action-btn"
							onClick={() => onReply(comment.id)}
						>
							Reply
						</button>
					)}
					{isOwn && !isSealed && (
						<>
							<button
								type="button"
								className="comment-thread__action-btn"
								onClick={() => setEditing(true)}
							>
								Edit
							</button>
							<button
								type="button"
								className="comment-thread__action-btn comment-thread__action-btn--delete"
								onClick={() => onDelete(comment.id)}
							>
								Delete
							</button>
						</>
					)}
				</div>
			)}

			{/* Inline reply form */}
			{replyingTo === comment.id && (
				<div className="comment-thread__reply-form">
					<textarea
						className="comment-thread__textarea"
						placeholder={`Reply to ${comment.author_username}…`}
						value={replyBody}
						onChange={(e) => onReplyBodyChange(e.target.value)}
						autoFocus
					/>
					<div className="comment-thread__reply-actions">
						<Button size="small" onClick={onReplySubmit} isDisabled={!replyBody.trim()}>
							Reply
						</Button>
						<Button size="small" variant="secondary" onClick={onReplyCancel}>
							Cancel
						</Button>
					</div>
				</div>
			)}

			{/* Threaded replies */}
			{replies.map((reply) => (
				<div key={reply.id} className="comment-thread__item comment-thread__item--reply">
					<div className="comment-thread__item-header">
						<span className="comment-thread__item-author">{reply.author_username}</span>
						<span className="comment-thread__item-time">{formatRelative(reply.created_at)}</span>
						{wasEdited(reply) && (
							<span className="comment-thread__item-edited">edited</span>
						)}
					</div>
					<p className="comment-thread__item-body">{reply.body}</p>
					{reply.author_id === currentUserId && !isSealed && (
						<div className="comment-thread__item-actions">
							<button
								type="button"
								className="comment-thread__action-btn comment-thread__action-btn--delete"
								onClick={() => onDelete(reply.id)}
							>
								Delete
							</button>
						</div>
					)}
				</div>
			))}
		</div>
	);
};

// ─── Main component ───────────────────────────────────────────────────────────

interface CommentThreadProps {
	proposalId: string;
	currentUserId: string | null;
	isSealed: boolean;
}

const CommentThread: React.FC<CommentThreadProps> = ({
	proposalId,
	currentUserId,
	isSealed,
}) => {
	const [comments, setComments] = useState<Comment[]>([]);
	const [loading, setLoading] = useState(true);
	const [draftBody, setDraftBody] = useState("");
	const [replyingTo, setReplyingTo] = useState<string | null>(null);
	const [replyBody, setReplyBody] = useState("");

	// Load comments whenever the proposal changes.
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		commentsApi
			.getForProposal(proposalId)
			.then((data) => { if (!cancelled) setComments(data); })
			.catch(console.error)
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [proposalId]);

	// ── Actions ──────────────────────────────────────────────────────────

	const handlePost = async () => {
		const body = draftBody.trim();
		if (!body) return;
		try {
			const created = await commentsApi.create({ proposal_id: proposalId, body });
			setComments((prev) => [...prev, created]);
			setDraftBody("");
		} catch (err) {
			console.error("Failed to post comment:", err);
		}
	};

	const handleReplySubmit = async () => {
		if (!replyingTo || !replyBody.trim()) return;
		try {
			const created = await commentsApi.create({
				proposal_id: proposalId,
				parent_id: replyingTo,
				body: replyBody.trim(),
			});
			setComments((prev) => [...prev, created]);
			setReplyingTo(null);
			setReplyBody("");
		} catch (err) {
			console.error("Failed to post reply:", err);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await commentsApi.delete(id);
			setComments((prev) => prev.filter((c) => c.id !== id));
		} catch (err) {
			console.error("Failed to delete comment:", err);
		}
	};

	const handleUpdate = async (id: string, body: string) => {
		try {
			await commentsApi.edit(id, body);
			setComments((prev) =>
				prev.map((c) =>
					c.id === id ? { ...c, body, updated_at: new Date().toISOString() } : c
				)
			);
		} catch (err) {
			console.error("Failed to edit comment:", err);
		}
	};

	// ── Render ────────────────────────────────────────────────────────────

	// Split into top-level comments and their replies.
	const topLevel = comments.filter((c) => c.parent_id === null);
	const repliesFor = (id: string) => comments.filter((c) => c.parent_id === id);

	return (
		<section className="comment-thread">
			<div className="comment-thread__header">
				<h3 className="comment-thread__title">Deliberation</h3>
				{comments.length > 0 && (
					<span className="comment-thread__count">{comments.length}</span>
				)}
			</div>

			{isSealed && (
				<div className="comment-thread__sealed-label">
					<LockClosedIcon className="comment-thread__sealed-icon" />
					Deliberation record — sealed
				</div>
			)}

			{!loading && comments.length === 0 && (
				<p className="comment-thread__empty">
					{isSealed ? "No deliberation was recorded." : "No comments yet. Be the first to weigh in."}
				</p>
			)}

			{topLevel.length > 0 && (
				<div className="comment-thread__list">
					{topLevel.map((comment) => (
						<CommentItem
							key={comment.id}
							comment={comment}
							replies={repliesFor(comment.id)}
							currentUserId={currentUserId}
							isSealed={isSealed}
							onReply={setReplyingTo}
							onDelete={handleDelete}
							onUpdate={handleUpdate}
							replyingTo={replyingTo}
							replyBody={replyBody}
							onReplyBodyChange={setReplyBody}
							onReplySubmit={handleReplySubmit}
							onReplyCancel={() => { setReplyingTo(null); setReplyBody(""); }}
						/>
					))}
				</div>
			)}

			{!isSealed && (
				<div className="comment-thread__compose">
					<textarea
						className="comment-thread__textarea"
						placeholder="Add to the deliberation…"
						value={draftBody}
						onChange={(e) => setDraftBody(e.target.value)}
					/>
					<div className="comment-thread__compose-actions">
						<Button size="small" onClick={handlePost} isDisabled={!draftBody.trim()}>
							Comment
						</Button>
					</div>
				</div>
			)}
		</section>
	);
};

export default CommentThread;
