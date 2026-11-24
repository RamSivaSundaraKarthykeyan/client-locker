-- ====================================================================
-- CLIENT LOCKER STRETCH (M5) SCHEMA ENHANCEMENTS
-- ====================================================================

-- 1. Access that ends on a set date
ALTER TABLE client_access ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Partner Two-Step Login (2FA verification codes)
CREATE TABLE IF NOT EXISTS partner_2fa_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
