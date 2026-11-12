-- ====================================================================
-- CLIENT LOCKER M2 DATABASE SCHEMA
-- Execute this script in Supabase Dashboard -> SQL Editor -> New Query
-- ====================================================================

-- 1. FIRMS TABLE
CREATE TABLE IF NOT EXISTS firms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PEOPLE TABLE (Partners, Staff, Clients)
-- Roles: 'partner', 'staff', 'client'
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('partner', 'staff', 'client')),
    title TEXT DEFAULT '', -- e.g., 'Senior Partner', 'Audit Senior', 'Trainee'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLIENTS TABLE (Companies / Client entities)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT DEFAULT '',
    primary_contact_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLIENT ACCESS TABLE (Which staff has access to which client)
CREATE TABLE IF NOT EXISTS client_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, person_id)
);

-- 5. FILES TABLE
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    uploaded_by_person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHECKLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed')),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STORAGE BUCKET: client-vault (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-vault',
    'client-vault',
    false,
    4194304, -- 4 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 4194304,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

