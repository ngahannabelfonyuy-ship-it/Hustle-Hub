-- ============================================================
-- HustleHub — Base Database Schema Setup
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor) BEFORE 001_modules.sql
-- ============================================================

-- 1. PROFILES TABLE
-- Holds extended profile information for users (students/workers, employers, and admins).
-- Relates directly to Supabase Auth auth.users.
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  role                TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'employer', 'student', 'worker')),
  avatar_url          TEXT,
  bio                 TEXT DEFAULT '',
  skills              TEXT[] DEFAULT '{}',
  location            TEXT DEFAULT '',
  company_name        TEXT DEFAULT '',
  badge               TEXT, -- Badge awarded (e.g. 'Top Pro', 'Rising Star', 'Verified Student')
  is_verified         BOOLEAN DEFAULT FALSE,
  student_status      BOOLEAN DEFAULT FALSE,
  rating              NUMERIC(3, 2) DEFAULT 5.0,
  total_reviews       INTEGER DEFAULT 0,
  trust_score         INTEGER DEFAULT 80,
  notification_prefs  JSONB DEFAULT '{}',
  payment_prefs       JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read user profiles (public profiles)
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to update their own profile records
CREATE POLICY "profiles_user_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to update or delete any profile record
CREATE POLICY "profiles_admin_manage" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 2. AUTOMATIC PROFILE SYNC ON SIGN UP
-- Automatically inserts a record into public.profiles when a new auth.user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=' || NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. JOBS TABLE
-- Stores gig contracts posted by clients (employers).
CREATE TABLE IF NOT EXISTS public.jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  location      TEXT NOT NULL,
  budget        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view jobs (guests browse jobs, workers search gigs)
CREATE POLICY "jobs_public_read" ON public.jobs
  FOR SELECT USING (true);

-- Allow clients to create/update their own job listings
CREATE POLICY "jobs_client_manage" ON public.jobs
  FOR ALL USING (auth.uid() = client_id);

-- Allow assigned providers (workers) to update job states (e.g. mark in progress or completed)
CREATE POLICY "jobs_provider_update" ON public.jobs
  FOR UPDATE USING (auth.uid() = provider_id);

-- Allow admins full control
CREATE POLICY "jobs_admin_manage" ON public.jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 4. VERIFICATIONS TABLE
-- Stores worker verification applications.
CREATE TABLE IF NOT EXISTS public.verifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_card_url         TEXT,
  guarantor_form_url  TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for verifications
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own verification applications
CREATE POLICY "users_manage_own_verification" ON public.verifications
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view and manage all verification applications
CREATE POLICY "admins_manage_all_verifications" ON public.verifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 5. DISPUTES TABLE
-- Arbitrates job disputes between clients and workers.
CREATE TABLE IF NOT EXISTS public.disputes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  opened_by   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for disputes
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Involved parties can read their disputes
CREATE POLICY "parties_read_disputes" ON public.disputes
  FOR SELECT USING (
    auth.uid() = opened_by OR EXISTS (
      SELECT 1 FROM public.jobs WHERE jobs.id = disputes.job_id AND (jobs.client_id = auth.uid() OR jobs.provider_id = auth.uid())
    )
  );

-- Authenticated users can create/open disputes
CREATE POLICY "authenticated_create_dispute" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = opened_by);

-- Admins can manage all disputes
CREATE POLICY "admins_manage_all_disputes" ON public.disputes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 6. PLATFORM SETTINGS SINGLETON TABLE
-- Holds platform-wide config variables.
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id                BOOLEAN PRIMARY KEY DEFAULT TRUE CONSTRAINT singleton CHECK (id),
  platform_name     TEXT NOT NULL DEFAULT 'HustleHub',
  support_email     TEXT NOT NULL DEFAULT 'support@hustlehub.cm',
  min_job_budget    NUMERIC(12, 2) NOT NULL DEFAULT 500,
  escrow_fee_pct    NUMERIC(5, 2) NOT NULL DEFAULT 5,
  allow_cash_jobs   BOOLEAN NOT NULL DEFAULT TRUE,
  require_guarantor BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_mode  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Populate single platform settings default
INSERT INTO public.platform_settings (id) VALUES (TRUE) ON CONFLICT DO NOTHING;

-- Enable RLS for settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can select/read platform settings
CREATE POLICY "public_read_settings" ON public.platform_settings
  FOR SELECT USING (true);

-- Only admins can modify platform settings
CREATE POLICY "admin_manage_settings" ON public.platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
