-- card_sets.id is text NOT NULL with no default.
-- When creating a new set, the frontend doesn't provide an id,
-- causing: "null value in column id violates not-null constraint".
-- Fix: add a default so new rows auto-generate a uuid text id.

ALTER TABLE card_sets ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
