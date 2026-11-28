CREATE TABLE IF NOT EXISTS growth_content (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pillar VARCHAR(30) NOT NULL CHECK (pillar IN ('christian_life', 'personal_growth')),
    content JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(content) = 'object'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, pillar)
);
