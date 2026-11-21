import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { getServiceSupabase } from '@/lib/supabase';

// DELETE /api/access/:id: Partners remove access.
// Removing access takes effect on the person's very next request, with no logout needed.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'partner') {
    return NextResponse.json({ error: 'Forbidden: Only partners can manage client access' }, { status: 403 });
  }

  const { id: accessId } = await params;
  const supabase = getServiceSupabase();

  // Find who this access was for before deleting
  const { data: accessRow } = await supabase
    .from('client_access')
    .select('id, client_id, person_id, person:people!client_access_person_id_fkey(full_name, email)')
    .eq('id', accessId)
    .single();

  const { error } = await supabase.from('client_access').delete().eq('id', accessId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const personObj = accessRow?.person as unknown;
  const personName = (personObj && typeof personObj === 'object' && 'full_name' in personObj)
    ? String((personObj as { full_name: string }).full_name)
    : accessRow?.person_id;

  await logActivity({
    personId: session.id,
    clientId: accessRow?.client_id,
    action: 'access_revoked',
    blocked: false,
    details: `Partner ${session.fullName} revoked access for ${personName}`,
  });

  return NextResponse.json({ success: true });
}
