-- ==============================================================================
-- APORIA TRACE // NEURAX — Supabase Database Schema
-- Paste this script into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rgmbebromgtqusjiuvnv/sql/new
-- ==============================================================================

-- 1. Users Table (Enterprise Analyst Accounts & Clearance Levels)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Senior Intelligence Analyst',
    clearance TEXT NOT NULL DEFAULT 'LEVEL 3 - OSINT/PUBLIC',
    created_at TEXT NOT NULL DEFAULT NOW()::text,
    last_login TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Password Resets Table
CREATE TABLE IF NOT EXISTS public.password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL DEFAULT NOW()::text
);

CREATE INDEX IF NOT EXISTS idx_resets_token ON public.password_resets(token);

-- 3. Revoked JWT Tokens (Logout Blacklist)
CREATE TABLE IF NOT EXISTS public.revoked_tokens (
    token_jti TEXT PRIMARY KEY,
    revoked_at TEXT NOT NULL DEFAULT NOW()::text
);

-- 4. Cloud Investigations & OSINT Footprint Dossiers
CREATE TABLE IF NOT EXISTS public.investigations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    target_name TEXT,
    seed_handle TEXT,
    email TEXT,
    likely_identity TEXT,
    overall_confidence FLOAT,
    data JSONB NOT NULL,
    created_at TEXT NOT NULL DEFAULT NOW()::text
);

CREATE INDEX IF NOT EXISTS idx_investigations_user ON public.investigations(user_id);
CREATE INDEX IF NOT EXISTS idx_investigations_created ON public.investigations(created_at DESC);

-- Enable RLS & Allow Access for API Keys
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow API Access" ON public.users;
CREATE POLICY "Allow API Access" ON public.users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow API Access" ON public.password_resets;
CREATE POLICY "Allow API Access" ON public.password_resets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow API Access" ON public.revoked_tokens;
CREATE POLICY "Allow API Access" ON public.revoked_tokens FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow API Access" ON public.investigations;
CREATE POLICY "Allow API Access" ON public.investigations FOR ALL USING (true) WITH CHECK (true);
