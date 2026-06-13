-- Migration: Initial Schema for Pistoleo Platform
-- Creates tables for the Pistoleo inventory scanning system

-- ============================================================
-- USERS (admin only)
-- ============================================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  avatar_url TEXT,
  bio TEXT,
  hourly_rate NUMERIC,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMPTZ,
  terms_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PISTOLEO BATCHES
-- ============================================================
CREATE TABLE pistoleo_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PISTOLEO INVENTORY
-- ============================================================
CREATE TABLE pistoleo_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES pistoleo_batches(id) ON DELETE CASCADE,
  upc TEXT NOT NULL,
  description TEXT,
  expected_quantity INTEGER NOT NULL DEFAULT 0,
  actual_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'partial', 'complete', 'over')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, upc)
);

CREATE INDEX idx_pistoleo_inventory_batch ON pistoleo_inventory(batch_id, upc);

-- ============================================================
-- PISTOLEO SCANS
-- ============================================================
CREATE TABLE pistoleo_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES pistoleo_batches(id) ON DELETE CASCADE,
  upc TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pistoleo_scans_batch ON pistoleo_scans(batch_id, upc);
