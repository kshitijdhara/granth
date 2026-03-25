import { http } from "@/lib/http";
import type { Document } from "./types";

export const documentsApi = {
  getAll: () => http.get<Document[]>("/documents/all"),

  get: (id: string) => http.get<Document>(`/documents/${id}`),

  create: (title: string) => http.post<{ document_id: string }>("/documents/create", { title }),

  update: (id: string, data: Partial<Document>) => http.put<void>(`/documents/${id}`, data),

  delete: (id: string) => http.delete<void>(`/documents/${id}`),
};
