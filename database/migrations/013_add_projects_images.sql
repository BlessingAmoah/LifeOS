-- Add image/diagram support to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

COMMENT ON COLUMN projects.image_url IS 'URL to project diagram or image stored in Azure Blob Storage';
