-- Migration: Add Life Balance Radar Chart and Strategic Adjustments to Reviews
-- Add fields for life balance scores (radar chart data) and strategic adjustments

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS life_balance_scores JSONB,
ADD COLUMN IF NOT EXISTS strategic_adjustments TEXT;

-- Add comments
COMMENT ON COLUMN reviews.life_balance_scores IS 'JSON object with life balance scores for radar chart (e.g., {"health": 7, "career": 8, "relationships": 6, "spiritual": 5, "financial": 7, "personal_growth": 6})';
COMMENT ON COLUMN reviews.strategic_adjustments IS 'Strategic adjustments and changes to make based on review insights';
