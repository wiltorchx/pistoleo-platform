-- Migration: Disable RLS on pistoleo tables for development
-- Supabase enables RLS by default on new tables, blocking all operations if no policies exist

ALTER TABLE pistoleo_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE pistoleo_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE pistoleo_scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;