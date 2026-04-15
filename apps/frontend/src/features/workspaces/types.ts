export interface Workspace {
	id: string;
	name: string;
	description: string;
	owner_id: string;
	created_at: string;
	updated_at: string;
}

export interface WorkspaceMember {
	id: string;
	workspace_id: string;
	user_id: string;
	username: string;
	role: WorkspaceRole;
	invited_by?: string;
	joined_at: string;
}

export type WorkspaceRole = "admin" | "reviewer" | "contributor";
