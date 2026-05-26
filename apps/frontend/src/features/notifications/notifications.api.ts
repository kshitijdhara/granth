import { http } from "@/lib/http";

export interface Notification {
	id: string;
	user_id: string;
	kind: string;
	payload: Record<string, string>;
	read: boolean;
	created_at: string;
}

export const notificationsApi = {
	list: () => http.get<Notification[]>("/notifications"),
	markRead: (id: string) => http.post<void>(`/notifications/${id}/read`),
	markAllRead: () => http.post<void>("/notifications/read-all"),
	count: () => http.get<{ unread: number }>("/notifications/count"),
};

// Human-readable label for each notification kind.
export const notificationLabel = (n: Notification): string => {
	const title = n.payload.title ?? "a proposal";
	switch (n.kind) {
		case "proposal_submitted":
			return `New proposal: "${title}"`;
		case "proposal_accepted":
			return `Your proposal "${title}" was accepted`;
		case "proposal_rejected":
			return `Your proposal "${title}" was declined`;
		case "comment_posted":
			return `New comment on "${title}"`;
		case "conflict_detected":
			return `Conflict detected on "${title}"`;
		case "approval_cast":
			return `Someone approved "${title}" (${n.payload.approval_count}/${n.payload.required_count})`;
		default:
			return "New notification";
	}
};
