import { http } from "@/lib/http";

export interface Proposal {
	id: string;
	document_id: string;
	affected_block_ids: string[];
	title: string;
	author_id: string;
	intent: string;
	scope: string;
	state: string;
	rejection_reason?: string | null;
	created_at: string;
	updated_at: string;
}

export interface ProposalBlockChange {
	id: string;
	proposal_id: string;
	block_id: string | null;
	action: string;
	block_type: string;
	order_path: number[];
	content: string;
	created_by: string;
	created_at: string;
}

export const proposalsApi = {
	getForDocument: (documentId: string) => http.get<Proposal[]>(`/proposals/document/${documentId}`),

	create: (
		documentId: string,
		data: {
			title: string;
			intent: string;
			scope: string;
			affected_block_ids: string[];
		}
	) => http.post<{ proposal_id: string }>(`/proposals/document/${documentId}`, data),

	get: (id: string) => http.get<Proposal>(`/proposals/${id}`),

	update: (
		id: string,
		data: { title: string; intent: string; scope: string; affected_block_ids: string[] }
	) => http.put<void>(`/proposals/${id}`, data),

	delete: (id: string) => http.delete<void>(`/proposals/${id}`),

	accept: (id: string) => http.post<void>(`/proposals/${id}/accept`),

	reject: (id: string, reason?: string) =>
		http.post<void>(`/proposals/${id}/reject`, reason ? { reason } : {}),

	getBlockChanges: (proposalId: string) =>
		http.get<ProposalBlockChange[]>(`/proposals/${proposalId}/changes`),

	addBlockChange: (
		proposalId: string,
		data: {
			block_id: string | null;
			action: string;
			block_type: string;
			order_path: number[];
			content: string;
		}
	) => http.post<void>(`/proposals/${proposalId}/changes`, data),
};
