-- Migration: Add Health Enhancements (Nutrition, Weight/Vitals, Mental Health)
-- Add fields for enhanced nutrition tracking, weight/vitals, and mental health check-ins

ALTER TABLE health_logs
ADD COLUMN IF NOT EXISTS nutrition_notes TEXT,
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS blood_pressure_systolic INT,
ADD COLUMN IF NOT EXISTS blood_pressure_diastolic INT,
ADD COLUMN IF NOT EXISTS heart_rate INT,
ADD COLUMN IF NOT EXISTS mental_health_score INT CHECK (mental_health_score BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS mental_health_notes TEXT,
ADD COLUMN IF NOT EXISTS mood VARCHAR(50),
ADD COLUMN IF NOT EXISTS stress_level INT CHECK (stress_level BETWEEN 1 AND 10);

-- Add comments
COMMENT ON COLUMN health_logs.nutrition_notes IS 'Enhanced nutrition tracking notes (meals, calories, macros, etc.)';
COMMENT ON COLUMN health_logs.weight IS 'Weight in kg or lbs';
COMMENT ON COLUMN health_logs.blood_pressure_systolic IS 'Systolic blood pressure';
COMMENT ON COLUMN health_logs.blood_pressure_diastolic IS 'Diastolic blood pressure';
COMMENT ON COLUMN health_logs.heart_rate IS 'Heart rate (bpm)';
COMMENT ON COLUMN health_logs.mental_health_score IS 'Mental health score 1-10';
COMMENT ON COLUMN health_logs.mental_health_notes IS 'Mental health check-in notes';
COMMENT ON COLUMN health_logs.mood IS 'Mood indicator';
COMMENT ON COLUMN health_logs.stress_level IS 'Stress level 1-10';
