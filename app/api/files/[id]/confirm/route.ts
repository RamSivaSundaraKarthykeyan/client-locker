import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkClientAccess } from '@/lib/access';
import { logActivity } from '@/lib/activity';
import { getServiceSupabase } from '@/lib/supabase';

// POST /api/files/:id/confirm:
// Partners and assigned staff: confirm the checklist item. Only then is the item ticked.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'partner' && session.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: fileId } = await params;
  const { checklistItemId } = await request.json();

  if (!checklistItemId) {
    return NextResponse.json({ error: 'checklistItemId is required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data: file, error: fileErr } = await supabase
    .from('files')
    .select('id, client_id, file_name')
    .eq('id', fileId)
    .single();

  if (fileErr || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const hasAccess = await checkClientAccess(session, file.client_id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 1. Mark checklist item as completed
  await supabase
    .from('checklist_items')
    .update({ status: 'completed', done: true })
    .eq('id', checklistItemId);

  // 2. Link file to checklist item
  await supabase
    .from('files')
    .update({ checklist_item_id: checklistItemId })
    .eq('id', fileId);

  await logActivity({
    personId: session.id,
    fileId,
    clientId: file.client_id,
    action: 'confirm_item',
    blocked: false,
    details: `Confirmed checklist item ${checklistItemId} for file ${file.file_name}`,
  });

  return NextResponse.json({ success: true });
}
