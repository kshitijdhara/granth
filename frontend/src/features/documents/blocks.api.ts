import { http } from "@/lib/http";
import type { Block } from "./types";

export const blocksApi = {
	getAll: (documentId: string) => http.get<Block[]>(`/documents/${documentId}/blocks`),

	create: (documentId: string, block: Pick<Block, "content" | "block_type" | "order_path">) =>
		http.post<void>(`/documents/${documentId}/blocks/create`, block),

	update: (documentId: string, block: Partial<Block>) =>
		http.put<void>(`/documents/${documentId}/blocks/update`, block),

	delete: (documentId: string, blockId: string) =>
		http.delete<void>(`/documents/${documentId}/blocks/delete`, { block_id: blockId }),
};
