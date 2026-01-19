import { api } from '../../../services/baseApi';
import { type Block } from '../../documents/types/blocks';

// Blocks API methods
export const blocksAPI = {
  // Get all blocks for a document
  getAllBlocks: async (documentId: string): Promise<Block[]> => {
    const response = await api.get(`/documents/${documentId}/blocks`);
    return response.data;
  },

  // Create a new block for a document
  createBlock: async (documentId: string, block: Partial<Block>): Promise<void> => {
    // Only send the fields the server expects for creation.
    const payload: { content?: string; block_type?: string; order_path?: number } = {
      content: block.content,
      block_type: block.block_type,
      order_path: block.order_path,
    };
    await api.post(`/documents/${documentId}/blocks/create`, payload);
  },

  // Update a block (server expects document id in path per routes)
  updateBlock: async (documentId: string, block: Partial<Block>): Promise<void> => {
    await api.put(`/documents/${documentId}/blocks/update`, block);
  },

  // Delete a block by id
  deleteBlock: async (documentId: string, blockId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}/blocks/delete`, { data: { block_id: blockId } });
  },
};