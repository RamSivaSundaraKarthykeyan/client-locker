-- ====================================================================
-- CLIENT LOCKER M3 / M4 SCHEMA ENHANCEMENTS
-- Execute in Supabase SQL Editor if updating live schema
-- ====================================================================

-- 1. Ensure 'auditor' role is allowed in people
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_role_check;
ALTER TABLE people ADD CONSTRAINT people_role_check CHECK (role IN ('partner', 'staff', 'client', 'auditor'));

-- 2. Add magic link login tokens
CREATE TABLE IF NOT EXISTS magic_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add 10-minute expiring download links
CREATE TABLE IF NOT EXISTS download_links (
    token TEXT PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add Activity Log (Immutable audit trail for partners)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'upload', 'open_link', 'access_granted', 'access_revoked', 'magic_login', 'suggest_item', 'confirm_item'
    blocked BOOLEAN NOT NULL DEFAULT false,
    details TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Checklist item linkage to file
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT false;
ALTER TABLE files ADD COLUMN IF NOT EXISTS checklist_item_id UUID REFERENCES checklist_items(id) ON DELETE SET NULL;
