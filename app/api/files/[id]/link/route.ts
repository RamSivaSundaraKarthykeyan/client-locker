import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { checkClientAccess } from '@/lib/access';
import { logActivity } from '@/lib/activity';
import { getServiceSupabase } from '@/lib/supabase';

// POST /api/files/:id/link: Anyone with access makes a 10-minute link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: fileId } = await params;
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
    await logActivity({
      personId: session.id,
      fileId,
      clientId: file.client_id,
      action: 'generate_link',
      blocked: true,
      details: `User denied access to generate link for file ${file.file_name}`,
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 10-minute expiry
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: linkErr } = await supabase.from('download_links').insert({
    token,
    file_id: fileId,
    person_id: session.id,
    expires_at: expiresAt,
  });

  if (linkErr) {
    return NextResponse.json({ error: linkErr.message }, { status: 500 });
  }

  return NextResponse.json({
    token,
    url: `/api/links/${token}`,
    expiresAt,
  });
}
