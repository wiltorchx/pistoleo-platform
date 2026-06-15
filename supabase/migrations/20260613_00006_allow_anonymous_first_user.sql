-- Migration: Allow anonymous insert of first admin user (bypass RLS for seed)
-- This policy allows INSERT only when no users exist, for the initial admin setup.
-- After the first user is created, this policy becomes inactive.

CREATE POLICY "Users: allow anonymous first insert" ON users
  FOR INSERT WITH CHECK (
    NOT EXISTS (SELECT 1 FROM users)
  );
