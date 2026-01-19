import { api } from '../../../services/baseApi';

// Document types
export interface Document {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

// Documents API methods
export const documentsAPI = {
  // Get all documents for the current user
  getAllDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/documents/all');
    return response.data;
  },

  // Get a specific document
  getDocument: async (id: string): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // Create a new document
  createDocument: async (title: string): Promise<{ document_id: string }> => {
    const response = await api.post('/documents/create', { title });
    return response.data;
  },

  // Update a document
  updateDocument: async (id: string, data: Partial<Document>): Promise<void> => {
    await api.put(`/documents/${id}`, data);
  },

  // Delete a document
  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
};