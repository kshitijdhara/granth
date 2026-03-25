export interface Document {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface Block {
  id: string;
  document_id: string;
  block_type: string;
  order_path: number[];
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}
