import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { getServiceSupabase } from '@/lib/supabase';

// POST /api/access: Partners give a person access to a client (optional expiresAt date)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'partner') {
    return NextResponse.json({ error: 'Forbidden: Only partners can manage client access' }, { status: 403 });
  }

  const { clientId, personId, expiresAt } = await request.json();
  if (!clientId || !personId) {
    return NextResponse.json({ error: 'Missing clientId or personId' }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const insertData: Record<string, unknown> = {
    client_id: clientId,
    person_id: personId,
    given_by: session.id,
  };

  if (expiresAt) {
    insertData.expires_at = new Date(expiresAt).toISOString();
  }

  const { data, error } = await supabase
    .from('client_access')
    .insert(insertData)
    .select(`
      id,
      client_id,
      person_id,
      expires_at,
      person:people!client_access_person_id_fkey(id, full_name, email, role, title)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    personId: session.id,
    clientId,
    action: 'access_granted',
    blocked: false,
    details: `Partner ${session.fullName} granted access to person ${personId}${expiresAt ? ` (Expires on ${expiresAt})` : ''}`,
  });

  return NextResponse.json({ access: data }, { status: 201 });
}
