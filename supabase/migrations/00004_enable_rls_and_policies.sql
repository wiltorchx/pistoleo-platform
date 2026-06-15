-- Migration: Enable RLS and create policies for multi-user access
-- Run AFTER 00003_disable_rls.sql (this re-enables RLS with proper policies)

-- ============================================================
-- USERS: Add operator role
-- ============================================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator'));

-- ============================================================
-- PISTOLEO_BATCHES: Add signature column + created_by index
-- ============================================================
ALTER TABLE pistoleo_batches ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE pistoleo_batches ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_pistoleo_batches_created_by ON pistoleo_batches(created_by);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pistoleo_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pistoleo_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pistoleo_scans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS POLICIES
-- ============================================================
-- Admins can see all users, operators see only themselves
CREATE POLICY "Users: admin full access" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users: operator self read" ON users
  FOR SELECT USING (id = auth.uid());

-- ============================================================
-- BATCHES POLICIES
-- ============================================================
-- Admins: full access to all batches
CREATE POLICY "Batches: admin full access" ON pistoleo_batches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Operators: CRUD on their own batches, read on batches they're assigned to
CREATE POLICY "Batches: operator own CRUD" ON pistoleo_batches
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Batches: operator read assigned" ON pistoleo_batches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pistoleo_inventory 
      WHERE batch_id = pistoleo_batches.id 
      AND EXISTS (
        SELECT 1 FROM pistoleo_scans 
        WHERE batch_id = pistoleo_batches.id 
        AND user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- INVENTORY POLICIES
-- ============================================================
-- Admins: full access
CREATE POLICY "Inventory: admin full access" ON pistoleo_inventory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Operators: read/write on inventory of their batches
CREATE POLICY "Inventory: operator own batch access" ON pistoleo_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pistoleo_batches 
      WHERE id = pistoleo_inventory.batch_id 
      AND created_by = auth.uid()
    )
  );

-- Operators: read inventory of batches they've scanned
CREATE POLICY "Inventory: operator scanned batch read" ON pistoleo_inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pistoleo_scans 
      WHERE batch_id = pistoleo_inventory.batch_id 
      AND user_id = auth.uid()
    )
  );

-- ============================================================
-- SCANS POLICIES
-- ============================================================
-- Admins: full access
CREATE POLICY "Scans: admin full access" ON pistoleo_scans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Operators: insert own scans, read own scans, read scans on their batches
CREATE POLICY "Scans: operator insert own" ON pistoleo_scans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Scans: operator read own" ON pistoleo_scans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Scans: operator read batch scans" ON pistoleo_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pistoleo_batches 
      WHERE id = pistoleo_scans.batch_id 
      AND created_by = auth.uid()
    )
  );

-- ============================================================
-- HELPER FUNCTION: Get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$;