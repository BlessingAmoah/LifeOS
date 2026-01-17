-- Migration: Add vision_boards table for multiple vision entries
-- This allows users to create multiple vision boards instead of overriding

CREATE TABLE IF NOT EXISTS vision_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'My Vision',
  vision_type VARCHAR(20) DEFAULT 'short', -- 'short' or 'long'
  vision_short_term TEXT,
  vision_current_focus_theme TEXT,
  vision_top_priorities TEXT[],
  vision_season_of_life TEXT,
  vision_long_term TEXT,
  vision_career TEXT,
  vision_lifestyle TEXT,
  vision_financial TEXT,
  vision_spiritual TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vision_boards_user ON vision_boards(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vision_boards_type ON vision_boards(user_id, vision_type);

-- Add trigger for updated_at
CREATE TRIGGER update_vision_boards_updated_at BEFORE UPDATE ON vision_boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE vision_boards IS 'Multiple vision boards per user, each can be a separate vision';
COMMENT ON COLUMN vision_boards.title IS 'User-defined title for this vision board';
COMMENT ON COLUMN vision_boards.vision_type IS 'Type of vision: short or long';
