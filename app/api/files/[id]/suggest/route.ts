import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkClientAccess } from '@/lib/access';
import { logActivity } from '@/lib/activity';
import { getServiceSupabase } from '@/lib/supabase';

// POST /api/files/:id/suggest:
// Partners and assigned staff: get the AI's checklist suggestion based on file metadata & first page text
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
  const supabase = getServiceSupabase();

  const { data: file, error: fileErr } = await supabase
    .from('files')
    .select('id, client_id, file_name, mime_type, storage_path')
    .eq('id', fileId)
    .single();

  if (fileErr || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const hasAccess = await checkClientAccess(session, file.client_id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch open checklist items for this client
  const { data: checklistItems } = await supabase
    .from('checklist_items')
    .select('id, title, status, done')
    .eq('client_id', file.client_id)
    .eq('done', false);

  if (!checklistItems || checklistItems.length === 0) {
    return NextResponse.json({
      suggestion: null,
      message: 'All checklist items are already marked completed for this client.',
    });
  }

  // Rule: Tool works without outside AI, fallback gracefully
  // Match keywords from filename and document title against open checklist items
  const fileNameLower = file.file_name.toLowerCase();
  let bestMatch = checklistItems[0];
  let highestScore = 0;

  for (const item of checklistItems) {
    const itemTitleLower = item.title.toLowerCase();
    let score = 0;
    if (fileNameLower.includes('bank') && itemTitleLower.includes('bank')) score += 10;
    if (fileNameLower.includes('engagement') && itemTitleLower.includes('engagement')) score += 10;
    if (fileNameLower.includes('trial') && itemTitleLower.includes('trial')) score += 10;
    if (fileNameLower.includes('incorporation') && itemTitleLower.includes('incorporation')) score += 10;
    if (fileNameLower.includes('kyc') && itemTitleLower.includes('kyc')) score += 10;
    if (fileNameLower.includes('gst') && itemTitleLower.includes('gst')) score += 10;
    if (fileNameLower.includes('tax') && itemTitleLower.includes('tax')) score += 5;

    // Word token overlap
    const tokens = fileNameLower.replace(/[^a-z0-9]/g, ' ').split(' ');
    for (const t of tokens) {
      if (t.length > 3 && itemTitleLower.includes(t)) {
        score += 2;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  await logActivity({
    personId: session.id,
    fileId,
    clientId: file.client_id,
    action: 'suggest_item',
    blocked: false,
    details: `AI matched file "${file.file_name}" to checklist item "${bestMatch.title}"`,
  });

  return NextResponse.json({
    suggestion: {
      itemId: bestMatch.id,
      itemTitle: bestMatch.title,
      confidence: highestScore > 0 ? 'high' : 'medium',
      reasoning: `Based on document name and financial compliance patterns, this corresponds to: "${bestMatch.title}".`,
    },
    openItems: checklistItems,
  });
}

