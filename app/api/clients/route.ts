import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/clients: Everyone. Partners get all clients, staff and auditors get theirs, client gets only their own.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  if (session.role === 'partner') {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        industry,
        created_at,
        checklist_items(id, title, status, done),
        files(id, file_name, file_size_bytes, mime_type, created_at)
      `)
      .order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ clients: data });
  }

  if (session.role === 'staff' || session.role === 'auditor') {
    // Look up client_access
    const { data: accessRows } = await supabase
      .from('client_access')
      .select('client_id')
      .eq('person_id', session.id);

    const clientIds = (accessRows || []).map((r) => r.client_id);
    if (clientIds.length === 0) {
      return NextResponse.json({ clients: [] });
    }

    const { data, error } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        industry,
        created_at,
        checklist_items(id, title, status, done),
        files(id, file_name, file_size_bytes, mime_type, created_at)
      `)
      .in('id', clientIds)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ clients: data });
  }

  if (session.role === 'client') {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        industry,
        created_at,
        checklist_items(id, title, status, done),
        files(id, file_name, file_size_bytes, mime_type, created_at)
      `)
      .eq('primary_contact_person_id', session.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ clients: data || [] });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

