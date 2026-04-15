import { http } from "@/lib/http";
import type { Document } from "@/features/documents/types";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "./types";

export const workspacesApi = {
	getAll: () => http.get<Workspace[]>("/workspaces"),

	get: (id: string) => http.get<Workspace>(`/workspaces/${id}`),

	create: (name: string, description: string) =>
		http.post<Workspace>("/workspaces", { name, description }),

	update: (id: string, name: string, description: string) =>
		http.put<void>(`/workspaces/${id}`, { name, description }),

	delete: (id: string) => http.delete<void>(`/workspaces/${id}`),

	// Members
	getMembers: (workspaceId: string) =>
		http.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),

	addMember: (workspaceId: string, userId: string, role: WorkspaceRole) =>
		http.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, { user_id: userId, role }),

	updateMemberRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
		http.put<void>(`/workspaces/${workspaceId}/members/${userId}`, { role }),

	removeMember: (workspaceId: string, userId: string) =>
		http.delete<void>(`/workspaces/${workspaceId}/members/${userId}`),

	// Documents scoped to a workspace
	getDocuments: (workspaceId: string) =>
		http.get<Document[]>(`/workspaces/${workspaceId}/documents`),
};
