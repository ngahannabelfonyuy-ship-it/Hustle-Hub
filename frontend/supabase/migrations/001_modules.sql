-- ============================================================
-- HustleHub — Module Extensions Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. GUARANTORS
-- Stores guarantor information submitted by providers for verification.
-- Only one guarantor entry is expected per provider.
CREATE TABLE IF NOT EXISTS guarantors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL DEFAULT '',
  phone_number        TEXT NOT NULL DEFAULT '',
  email               TEXT NOT NULL DEFAULT '',
  residential_address TEXT NOT NULL DEFAULT '',
  relationship        TEXT NOT NULL DEFAULT '',
  occupation          TEXT NOT NULL DEFAULT '',
  national_id_number  TEXT NOT NULL DEFAULT '',
  id_document_url     TEXT,            -- URL to uploaded file in Supabase Storage
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_notes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id)                 -- one guarantor record per provider
);

-- Enable Row Level Security
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;

-- Providers can read/write their own guarantor record
CREATE POLICY "providers_manage_own_guarantor" ON guarantors
  FOR ALL USING (auth.uid() = provider_id);

-- Admins can read and update all guarantor records
CREATE POLICY "admins_manage_all_guarantors" ON guarantors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- 2. APPLICATIONS
-- Providers apply to open jobs posted by clients.
CREATE TABLE IF NOT EXISTS applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_note  TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, provider_id)        -- a provider can only apply once per job
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Providers can view/create their own applications
CREATE POLICY "providers_own_applications" ON applications
  FOR ALL USING (auth.uid() = provider_id);

-- Clients (employers) can view applications to their own jobs and update status
CREATE POLICY "clients_view_job_applications" ON applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.client_id = auth.uid()
    )
  );

-- Admins can read all
CREATE POLICY "admins_read_applications" ON applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 3. TRANSACTIONS
-- Escrow ledger. Each row represents a payment event in the job lifecycle.
CREATE TABLE IF NOT EXISTS transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         UUID REFERENCES jobs(id),
  payer_id       UUID REFERENCES profiles(id),   -- client who pays
  payee_id       UUID REFERENCES profiles(id),   -- provider who receives
  amount         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'escrow'
                   CHECK (payment_method IN ('mobile_money', 'card', 'cash', 'escrow')),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'held_in_escrow', 'released', 'refunded', 'failed')),
  reference      TEXT,                           -- external payment reference / receipt
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Providers and clients involved in a transaction can read it
CREATE POLICY "parties_read_transactions" ON transactions
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- Admins can read and update all
CREATE POLICY "admins_manage_transactions" ON transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 4. MESSAGES
-- Direct messages between platform users, optionally tied to a job.
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id      UUID REFERENCES jobs(id),          -- optional job context
  content     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received
CREATE POLICY "users_own_messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert messages where they are the sender
CREATE POLICY "users_send_messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update read status on received messages
CREATE POLICY "users_mark_read" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Admins can read all messages
CREATE POLICY "admins_read_messages" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- SUPABASE STORAGE SETUP
-- In the Supabase Dashboard → Storage, create a bucket named:
--   guarantor-docs
-- Set it to private (authenticated access only).
-- Suggested RLS policy for the bucket:
--   Allow authenticated users to upload to their own folder:
--     (storage.foldername(name))[1] = auth.uid()::text
-- ============================================================

-- Optional: add notification_prefs and payment_prefs JSONB columns
-- to profiles if they don't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notification_prefs'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notification_prefs JSONB DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_prefs'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_prefs JSONB DEFAULT '{}';
  END IF;
END $$;
