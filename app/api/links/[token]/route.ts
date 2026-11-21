import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkClientAccess } from '@/lib/access';
import { logActivity } from '@/lib/activity';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/links/:token: Open file after Task 6 checks:
// 1. Is the person logged in?
// 2. Has the link expired? (10 mins)
// 3. Does this person still have access to this client?
// If any check fails, respond 403 and add a blocked row to activity_log.
// If all checks pass, stream the file.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getSession();
  const { token } = await params;
  const supabase = getServiceSupabase();

  // Find token
  const { data: linkRow } = await supabase
    .from('download_links')
    .select(`
      token,
      file_id,
      person_id,
      expires_at,
      file:files(id, client_id, file_name, mime_type, storage_path)
    `)
    .eq('token', token)
    .single();

  if (!linkRow || !linkRow.file) {
    if (session) {
      await logActivity({
        personId: session.id,
        action: 'open_link',
        blocked: true,
        details: `Invalid link token ${token}`,
      });
    }
    return new NextResponse('Forbidden: Invalid download link', { status: 403 });
  }

  const fileData = Array.isArray(linkRow.file) ? linkRow.file[0] : linkRow.file;
  const clientId = fileData.client_id;
  const fileId = fileData.id;

  // Check 1: Is person logged in?
  if (!session) {
    await logActivity({
      fileId,
      clientId,
      action: 'open_link',
      blocked: true,
      details: 'Unauthenticated user attempted to open download link',
    });
    return new NextResponse('Unauthorized: Please log in', { status: 401 });
  }

  // Check 2: Has the link expired?
  const isExpired = new Date(linkRow.expires_at).getTime() < Date.now();
  if (isExpired) {
    await logActivity({
      personId: session.id,
      fileId,
      clientId,
      action: 'open_link',
      blocked: true,
      details: `Expired download link accessed by ${session.email}`,
    });
    return new NextResponse('Forbidden: Download link has expired (10-minute limit)', { status: 403 });
  }

  // Check 3: Does this person still have access to this client?
  const hasAccess = await checkClientAccess(session, clientId);
  if (!hasAccess) {
    await logActivity({
      personId: session.id,
      fileId,
      clientId,
      action: 'open_link',
      blocked: true,
      details: `Access revoked for user ${session.email} on client ${clientId}`,
    });
    return new NextResponse('Forbidden: You no longer have access to this client file', { status: 403 });
  }

  // All 3 checks passed! Log success and stream file
  await logActivity({
    personId: session.id,
    fileId,
    clientId,
    action: 'open_link',
    blocked: false,
    details: `Successfully opened ${fileData.file_name}`,
  });

  const { data: blob, error: downloadError } = await supabase.storage
    .from('client-vault')
    .download(fileData.storage_path);

  if (downloadError || !blob) {
    return new NextResponse('File retrieval error from private vault', { status: 502 });
  }

  const buffer = await blob.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': fileData.mime_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileData.file_name)}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}
