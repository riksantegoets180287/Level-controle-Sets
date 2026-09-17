-- The card_pairs.id column is text NOT NULL with no default.
-- When the frontend re-inserts pairs after editing, it doesn't provide an id,
-- causing the insert to fail silently (the delete already succeeded, losing data).
-- Fix: change the id column to uuid with a default of gen_random_uuid()
-- so inserts work even without an explicit id.

-- First drop the old text primary key constraint
ALTER TABLE card_pairs DROP CONSTRAINT card_pairs_pkey;

-- Change id column to uuid with auto-generated default
ALTER TABLE card_pairs ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE card_pairs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE card_pairs ALTER COLUMN id SET NOT NULL;

-- Recreate primary key
ALTER TABLE card_pairs ADD PRIMARY KEY (id);

-- Also change card_sets.id to allow text (it already uses text, no change needed there)
