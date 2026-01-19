CREATE TABLE DOCUMENTS (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES USERS (id) ON DELETE SET NULL,
    updated_by UUID REFERENCES USERS (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE block_type AS ENUM('text', 'image', 'code', 'header', 'list', 'quote');

CREATE TABLE BLOCKS (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    document_id UUID REFERENCES DOCUMENTS (id) ON DELETE CASCADE,
    order_path INT[] NOT NULL,
    type block_type NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    created_by UUID REFERENCES USERS (id) ON DELETE SET NULL,
    updated_by UUID REFERENCES USERS (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE BLOCKS
ADD CONSTRAINT unique_order_path_per_document UNIQUE (document_id, order_path);