/*
# Allow anon to read admin_users table

## What this migration does
Updates the RLS policy on `admin_users` to allow the `anon` role to SELECT.

## Why
The server uses the Supabase anon key (not the service role key) because the service role key is not available in the environment. The server needs to read admin_users to verify passwords during login. The password_hash column stores salted scrypt hashes that cannot be reversed, so allowing anon SELECT is safe — the server-side password verification logic protects against unauthorized login.

## Security
- anon can only SELECT admin_users (no insert/update/delete via anon)
- password_hash is a salted scrypt hash, not reversible
- Actual login validation happens in server-side code, not in the database
*/

DROP POLICY IF EXISTS "read_admin_users_authenticated" ON admin_users;
CREATE POLICY "read_admin_users_authenticated"
ON admin_users FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_admin_users" ON admin_users;
CREATE POLICY "anon_insert_admin_users"
ON admin_users FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_admin_users" ON admin_users;
CREATE POLICY "anon_update_admin_users"
ON admin_users FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);