-- Migration: Allow anon INSERT and UPDATE on users table
-- Required for auto-register and password reset when user exists with wrong password

DROP POLICY IF EXISTS "Users: allow anonymous first insert" ON users;

CREATE POLICY "Users: allow anon insert" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users: allow anon update" ON users
  FOR UPDATE USING (true) WITH CHECK (true);

