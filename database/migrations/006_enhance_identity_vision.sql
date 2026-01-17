-- Migration: Enhance Identity & Vision fields
-- Add comprehensive identity and vision tracking fields

-- Core Identity fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS life_pillars TEXT[], -- e.g., ['Faith', 'Health', 'Career', 'Relationships']
  ADD COLUMN IF NOT EXISTS personal_rules TEXT[], -- Personal rules/principles
  ADD COLUMN IF NOT EXISTS strengths TEXT[], -- List of strengths
  ADD COLUMN IF NOT EXISTS growth_areas TEXT[]; -- Areas for growth

-- Short-Term Vision fields (30-90 days)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS vision_current_focus_theme TEXT, -- Current focus theme
  ADD COLUMN IF NOT EXISTS vision_top_priorities TEXT[], -- Top 3 priorities
  ADD COLUMN IF NOT EXISTS vision_season_of_life TEXT; -- Season of life description

-- Long-Term Vision fields (1-5 years)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS vision_career TEXT, -- Career vision
  ADD COLUMN IF NOT EXISTS vision_lifestyle TEXT, -- Lifestyle vision
  ADD COLUMN IF NOT EXISTS vision_financial TEXT, -- Financial vision
  ADD COLUMN IF NOT EXISTS vision_spiritual TEXT; -- Spiritual vision

-- Add comments for documentation
COMMENT ON COLUMN profiles.preferred_name IS 'Preferred name/nickname';
COMMENT ON COLUMN profiles.life_pillars IS 'Life pillars (e.g., Faith, Health, Career, Relationships)';
COMMENT ON COLUMN profiles.personal_rules IS 'Personal rules and principles';
COMMENT ON COLUMN profiles.strengths IS 'List of personal strengths';
COMMENT ON COLUMN profiles.growth_areas IS 'Areas for personal growth';
COMMENT ON COLUMN profiles.vision_current_focus_theme IS 'Current focus theme (30-90 days)';
COMMENT ON COLUMN profiles.vision_top_priorities IS 'Top 3 priorities (30-90 days)';
COMMENT ON COLUMN profiles.vision_season_of_life IS 'Season of life description';
COMMENT ON COLUMN profiles.vision_career IS 'Long-term career vision (1-5 years)';
COMMENT ON COLUMN profiles.vision_lifestyle IS 'Long-term lifestyle vision (1-5 years)';
COMMENT ON COLUMN profiles.vision_financial IS 'Long-term financial vision (1-5 years)';
COMMENT ON COLUMN profiles.vision_spiritual IS 'Long-term spiritual vision (1-5 years)';
