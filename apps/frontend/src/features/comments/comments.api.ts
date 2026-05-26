import { http } from "@/lib/http";

export interface Comment {
	id: string;
	proposal_id: string;
	author_id: string;
	author_username: string;
	parent_id: string | null;
	body: string;
	created_at: string;
	updated_at: string;
}

export const commentsApi = {
	getForProposal: (proposalId: string) =>
		http.get<Comment[]>(`/comments?proposal_id=${proposalId}`),

	create: (data: { proposal_id: string; parent_id?: string | null; body: string }) =>
		http.post<Comment>("/comments", data),

	edit: (id: string, body: string) =>
		http.put<void>(`/comments/${id}`, { body }),

	delete: (id: string) =>
		http.delete<void>(`/comments/${id}`),
};
