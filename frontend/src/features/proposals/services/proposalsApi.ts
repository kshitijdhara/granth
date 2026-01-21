import { apiService } from '../../../services/baseApi';

export interface Proposal {
  id: string;
  document_id: string;
  affected_block_ids: string[];
  title: string;
  author_id: string;
  intent: string;
  scope: string;
  state: string;
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

export const proposalsAPI = {
  getProposalsForDocument: async (documentId: string): Promise<Proposal[]> => {
    const response = await apiService.get<Proposal[]>(`/proposals/document/${documentId}`);
    return response.data;
  },

  createProposal: async (documentId: string, data: {
    title: string;
    intent: string;
    scope: string;
    affected_block_ids: string[];
  }): Promise<{ proposal_id: string }> => {
    const response = await apiService.post<{ proposal_id: string }>(`/proposals/document/${documentId}`, data);
    return response.data;
  },

  getProposal: async (id: string): Promise<Proposal> => {
    const response = await apiService.get<Proposal>(`/proposals/${id}`);
    return response.data;
  },

  updateProposal: async (id: string, data: {
    title: string;
    intent: string;
    scope: string;
    affected_block_ids: string[];
  }): Promise<void> => {
    await apiService.put(`/proposals/${id}`, data);
  },

  deleteProposal: async (id: string): Promise<void> => {
    await apiService.delete(`/proposals/${id}`);
  },

  acceptProposal: async (id: string): Promise<void> => {
    await apiService.post(`/proposals/${id}/accept`);
  },

  rejectProposal: async (id: string): Promise<void> => {
    await apiService.post(`/proposals/${id}/reject`);
  },

  getBlockChanges: async (proposalId: string): Promise<ProposalBlockChange[]> => {
    const response = await apiService.get<ProposalBlockChange[]>(`/proposals/${proposalId}/changes`);
    return response.data;
  },

  addBlockChange: async (proposalId: string, data: {
    block_id: string | null;
    action: string;
    block_type: string;
    order_path: number[];
    content: string;
  }): Promise<void> => {
    await apiService.post(`/proposals/${proposalId}/changes`, data);
  },
};