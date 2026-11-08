-- ==============================================================================
-- TRUSTVAULT HIGH-ASSURANCE ZERO-TRUST DATABASE SCHEMA & RLS
-- Three-Role Model: 'admin', 'owner', 'co_owner'
-- Supports Profiles, Vault Records, Secrets, Document Hashes, Escrow, Audit Chains
-- ==============================================================================

-- Enable pgcrypto for UUIDs & digest
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner', 'co_owner')),
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Admins full access to profiles" 
    ON public.profiles FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own non-role profile fields" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    );

-- 2. VAULT RECORDS (Zero-Trust Asset Storage)
CREATE TABLE IF NOT EXISTS public.vault_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('credentials', 'documents', 'escrow', 'asset_lock')),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_email TEXT NOT NULL,
    secret_payload TEXT NOT NULL, -- AES-GCM 256 encrypted string or payload
    iv TEXT,                     -- Hex IV for AES-GCM
    salt TEXT,                   -- Hex Salt for PBKDF2
    integrity_hash TEXT,         -- SHA-256 integrity hash
    metadata TEXT,
    file_name TEXT,
    file_size BIGINT,
    storage_path TEXT,
    escrow_amount NUMERIC(18, 4),
    escrow_threshold INT DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'verified', 'released')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on vault_records
ALTER TABLE public.vault_records ENABLE ROW LEVEL SECURITY;

-- 3. VAULT ACCESS GRANTS (For Co-Owners)
CREATE TABLE IF NOT EXISTS public.vault_access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES public.vault_records(id) ON DELETE CASCADE,
    granted_to_email TEXT NOT NULL,
    granted_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'verify', 'approve')),
    granted_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(record_id, granted_to_email)
);

ALTER TABLE public.vault_access_grants ENABLE ROW LEVEL SECURITY;

-- 4. ESCROW APPROVAL SIGNATURES (Multi-Sig Autonomous Settlement)
CREATE TABLE IF NOT EXISTS public.escrow_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES public.vault_records(id) ON DELETE CASCADE,
    signer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    signer_email TEXT NOT NULL,
    signature_hash TEXT NOT NULL,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(record_id, signer_id)
);

ALTER TABLE public.escrow_approvals ENABLE ROW LEVEL SECURITY;

-- 5. TAMPER-PROOF CHAINED AUDIT LOG
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('success', 'denied')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES FOR ZERO-TRUST ENFORCEMENT
-- ==============================================================================

-- A. Vault Records: Admins can view audit metadata, Owners manage own, Co-Owners read granted only
CREATE POLICY "Admin full view vault_records"
    ON public.vault_records FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Owner full control vault_records"
    ON public.vault_records FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Co-Owner read permitted vault_records"
    ON public.vault_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.vault_access_grants vag
            WHERE vag.record_id = vault_records.id 
            AND (vag.granted_to_id = auth.uid() OR vag.granted_to_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
        )
    );

-- B. Vault Access Grants RLS
CREATE POLICY "Owner manage access grants"
    ON public.vault_access_grants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.vault_records vr 
            WHERE vr.id = vault_access_grants.record_id AND vr.owner_id = auth.uid()
        )
    );

CREATE POLICY "Co-Owners view own grants"
    ON public.vault_access_grants FOR SELECT
    USING (
        granted_to_id = auth.uid() OR 
        granted_to_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

-- C. Escrow Approvals RLS
CREATE POLICY "Participants submit escrow approval"
    ON public.escrow_approvals FOR INSERT
    WITH CHECK (
        signer_id = auth.uid() AND
        (
            -- Must be owner or permitted co-owner
            EXISTS (SELECT 1 FROM public.vault_records WHERE id = record_id AND owner_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM public.vault_access_grants WHERE record_id = escrow_approvals.record_id AND granted_to_id = auth.uid())
        )
    );

CREATE POLICY "View escrow approvals"
    ON public.escrow_approvals FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM public.vault_records WHERE id = record_id AND owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.vault_access_grants WHERE record_id = escrow_approvals.record_id AND granted_to_id = auth.uid())
    );

-- D. Audit Logs: Append-only by all authenticated users, readable by Admins & Actors
CREATE POLICY "Insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

CREATE POLICY "Admins view all audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users view own audit events"
    ON public.audit_logs FOR SELECT
    USING (actor_id = auth.uid());

-- Prevent update/delete on audit logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mod()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and tamper-evident. Updates/Deletions prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_mod ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_mod
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mod();
