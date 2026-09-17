/*
# Create database tables for the Summa card game

## What this migration does
Creates three tables to replace the existing JSON-file storage:
1. `admin_users` — stores admin accounts (email + password hash)
2. `card_sets` — stores card game sets (levels) with title, description, slug, active status
3. `card_pairs` — stores the individual card pairs belonging to each set

## Tables and columns

### admin_users
- `id` (uuid, primary key)
- `email` (text, unique, not null) — admin email address
- `password_hash` (text, not null) — hashed password (format: salt:hash)
- `created_at` (timestamptz, default now())

### card_sets
- `id` (text, primary key) — uses existing string IDs for backward compatibility
- `title` (text, not null) — display title
- `description` (text, default '') — short description
- `instructions` (text, default '') — player instructions
- `slug` (text, unique, not null) — URL slug
- `is_active` (boolean, default true) — whether the set is publicly visible
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### card_pairs
- `id` (text, primary key) — uses existing string IDs for backward compatibility
- `set_id` (text, not null, references card_sets(id) on delete cascade)
- `card_a_text` (text, not null) — green card text
- `card_b_text` (text, not null) — blue card text
- `card_a_image_url` (text) — optional image URL for card A
- `card_b_image_url` (text) — optional image URL for card B
- `sort_order` (integer, not null, default 1) — display order
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- This app has NO public sign-in screen (admin login is a custom password check, not Supabase Auth).
- The frontend uses the anon key, so policies are scoped to `anon, authenticated` for the data to be readable.
- `admin_users` is restricted: only authenticated users can read it (the server-side code uses the service role key for password verification, bypassing RLS).
- `card_sets` and `card_pairs` are publicly readable (anon can SELECT) and writable by anon (the server middleware controls admin actions via its own session check).

## Notes
1. `admin_users` password_hash uses a custom salted hash format, not Supabase Auth. The server validates passwords server-side with the service role key.
2. `card_sets` and `card_pairs` use text primary keys (not uuid) to preserve existing IDs during migration.
3. An index on `card_pairs.set_id` speeds up the common "get all pairs for a set" query.
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_sets (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  slug text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_pairs (
  id text PRIMARY KEY,
  set_id text NOT NULL REFERENCES card_sets(id) ON DELETE CASCADE,
  card_a_text text NOT NULL,
  card_b_text text NOT NULL,
  card_a_image_url text,
  card_b_image_url text,
  sort_order integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_pairs_set_id ON card_pairs(set_id);

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_pairs ENABLE ROW LEVEL SECURITY;

-- admin_users: only authenticated can read (server uses service role key for writes)
DROP POLICY IF EXISTS "read_admin_users_authenticated" ON admin_users;
CREATE POLICY "read_admin_users_authenticated"
ON admin_users FOR SELECT
TO authenticated USING (true);

-- card_sets: public read, anon write (server middleware controls admin actions)
DROP POLICY IF EXISTS "anon_select_card_sets" ON card_sets;
CREATE POLICY "anon_select_card_sets"
ON card_sets FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_card_sets" ON card_sets;
CREATE POLICY "anon_insert_card_sets"
ON card_sets FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_card_sets" ON card_sets;
CREATE POLICY "anon_update_card_sets"
ON card_sets FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_card_sets" ON card_sets;
CREATE POLICY "anon_delete_card_sets"
ON card_sets FOR DELETE
TO anon, authenticated USING (true);

-- card_pairs: public read, anon write
DROP POLICY IF EXISTS "anon_select_card_pairs" ON card_pairs;
CREATE POLICY "anon_select_card_pairs"
ON card_pairs FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_card_pairs" ON card_pairs;
CREATE POLICY "anon_insert_card_pairs"
ON card_pairs FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_card_pairs" ON card_pairs;
CREATE POLICY "anon_update_card_pairs"
ON card_pairs FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_card_pairs" ON card_pairs;
CREATE POLICY "anon_delete_card_pairs"
ON card_pairs FOR DELETE
TO anon, authenticated USING (true);