import { http } from "@/lib/http";
import type { Document } from "./types";

const inFlightGetAll = new Map<string, Promise<Document[]>>();

function dedupeGetAll(factory: () => Promise<Document[]>): Promise<Document[]> {
	const key = "all";
	const existing = inFlightGetAll.get(key);
	if (existing) return existing;
	const promise = factory().finally(() => {
		inFlightGetAll.delete(key);
	});
	inFlightGetAll.set(key, promise);
	return promise;
}

export const documentsApi = {
	getAll: () => dedupeGetAll(() => http.get<Document[]>("/documents/all")),

	get: (id: string) => http.get<Document>(`/documents/${id}`),

	create: (title: string, workspaceId?: string) =>
		http.post<{ document_id: string }>("/documents/create", {
			title,
			...(workspaceId ? { workspace_id: workspaceId } : {}),
		}),

	update: (id: string, data: Partial<Document>) => http.put<void>(`/documents/${id}`, data),

	delete: (id: string) => http.delete<void>(`/documents/${id}`),
};
