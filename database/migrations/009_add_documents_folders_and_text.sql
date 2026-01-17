-- Migration: Add folders and text documents support

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id);

-- Add folder_id and content fields to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) DEFAULT 'file', -- 'file' or 'text'
ADD COLUMN IF NOT EXISTS content TEXT, -- For text documents
ADD COLUMN IF NOT EXISTS content_format VARCHAR(20) DEFAULT 'plain'; -- 'plain' or 'rich'

CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- Add trigger for folders updated_at
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE folders IS 'Folders for organizing documents';
COMMENT ON COLUMN documents.document_type IS 'Type: file (uploaded) or text (created in editor)';
COMMENT ON COLUMN documents.content IS 'Text content for text documents';
COMMENT ON COLUMN documents.content_format IS 'Format: plain or rich (HTML)';
