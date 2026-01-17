-- Migration: Enhance Identity fields to support titles and descriptions
-- Convert simple TEXT[] arrays to JSONB arrays that can store objects with title, description, and value

-- Create a function to convert TEXT[] to JSONB
CREATE OR REPLACE FUNCTION text_array_to_jsonb(arr TEXT[])
RETURNS JSONB AS $$
BEGIN
  IF arr IS NULL THEN
    RETURN NULL;
  ELSIF array_length(arr, 1) IS NULL THEN
    RETURN '[]'::jsonb;
  ELSE
    RETURN (
      SELECT jsonb_agg(jsonb_build_object('value', val))
      FROM unnest(arr) AS val
    );
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update core_values to JSONB (storing objects: {value, title?, description?})
ALTER TABLE profiles
  ALTER COLUMN core_values TYPE JSONB USING text_array_to_jsonb(core_values);

-- Update life_pillars to JSONB
ALTER TABLE profiles
  ALTER COLUMN life_pillars TYPE JSONB USING text_array_to_jsonb(life_pillars);

-- Update personal_rules to JSONB
ALTER TABLE profiles
  ALTER COLUMN personal_rules TYPE JSONB USING text_array_to_jsonb(personal_rules);

-- Update strengths to JSONB
ALTER TABLE profiles
  ALTER COLUMN strengths TYPE JSONB USING text_array_to_jsonb(strengths);

-- Update growth_areas to JSONB
ALTER TABLE profiles
  ALTER COLUMN growth_areas TYPE JSONB USING text_array_to_jsonb(growth_areas);

-- Drop the temporary function
DROP FUNCTION text_array_to_jsonb(TEXT[]);

-- Add comments
COMMENT ON COLUMN profiles.core_values IS 'Core values as JSONB array: [{value, title?, description?}]';
COMMENT ON COLUMN profiles.life_pillars IS 'Life pillars as JSONB array: [{value, title?, description?}]';
COMMENT ON COLUMN profiles.personal_rules IS 'Personal rules as JSONB array: [{value, title?, description?}]';
COMMENT ON COLUMN profiles.strengths IS 'Strengths as JSONB array: [{value, title?, description?}]';
COMMENT ON COLUMN profiles.growth_areas IS 'Growth areas as JSONB array: [{value, title?, description?}]';
