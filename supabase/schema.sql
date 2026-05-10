-- ═══════════════════════════════════════════════════════════════
-- ScribIA — Supabase Database Schema
-- Execute this SQL in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED')),
  teacher_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Essays Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'CORRECTED')),
  ai_score INTEGER,
  ai_correction JSONB,
  teacher_notes TEXT,
  submitted_at TIMESTAMPTZ,
  corrected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Enrollments Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_code TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, teacher_id)
);

-- ─── Teacher Notes Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Class Preparations Table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS class_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_teacher_code ON users(teacher_code);
CREATE INDEX IF NOT EXISTS idx_essays_student_id ON essays(student_id);
CREATE INDEX IF NOT EXISTS idx_essays_status ON essays(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_teacher_id ON enrollments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notes_teacher_id ON teacher_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notes_student_id ON teacher_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_class_preparations_teacher_id ON class_preparations(teacher_id);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_preparations ENABLE ROW LEVEL SECURITY;

-- ─── Permissive policies for service_role (bypasses RLS anyway) ──

CREATE POLICY "service_role_all_users" ON users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_essays" ON essays
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_enrollments" ON enrollments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_teacher_notes" ON teacher_notes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_class_preparations" ON class_preparations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Policies for anon role ───────────────────────────────────

CREATE POLICY "anon_select_users" ON users
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_all_essays" ON essays
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_enrollments" ON enrollments
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_teacher_notes" ON teacher_notes
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_class_preparations" ON class_preparations
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- Grants
-- ═══════════════════════════════════════════════════════════════

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
