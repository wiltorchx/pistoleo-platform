-- Migration: Initial Schema for Pistoleo Platform
-- Creates all tables for the LMS + Pistoleo scanning system

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'admin')),
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
-- COURSES
-- ============================================================
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT NOT NULL,
  tutor_id UUID NOT NULL REFERENCES users(id),
  thumbnail_url TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  language TEXT NOT NULL CHECK (language IN ('english', 'spanish')),
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  modules JSONB DEFAULT '[]'::jsonb,
  total_duration INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  enrolled_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_language_level ON courses(language, level);
CREATE INDEX idx_courses_price ON courses(price);
CREATE INDEX idx_courses_enrolled_count ON courses(enrolled_count DESC);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'uploaded', 'verified', 'rejected')),
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'transferencia',
  payment_receipt_url TEXT,
  progress NUMERIC DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_lessons UUID[] DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

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
