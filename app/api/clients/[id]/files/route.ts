import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkClientAccess } from '@/lib/access';
import { logActivity } from '@/lib/activity';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/clients/:id/files: Anyone with access to that client. Others get 403.
// POST /api/clients/:id/files: Partners and assigned staff: upload file. Auditors and clients get 403.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: clientId } = await params;
  const hasAccess = await checkClientAccess(session, clientId);

  if (!hasAccess) {
    await logActivity({
      personId: session.id,
      clientId,
      action: 'list_files',
      blocked: true,
      details: `User ${session.email} (${session.role}) denied listing files for client ${clientId}`,
    });
    return NextResponse.json({ error: 'Forbidden: No access to this client' }, { status: 403 });
  }

  const supabase = getServiceSupabase();
  const { data: files, error } = await supabase
    .from('files')
    .select(`
      id,
      client_id,
      file_name,
      file_size_bytes,
      mime_type,
      checklist_item_id,
      created_at,
      uploaded_by:people!files_uploaded_by_person_id_fkey(id, full_name, email, role)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ files });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Auditors and Clients get 403 on upload
  if (session.role === 'auditor' || session.role === 'client') {
    const { id: clientId } = await params;
    await logActivity({
      personId: session.id,
      clientId,
      action: 'upload',
      blocked: true,
      details: `${session.role} attempt to upload blocked`,
    });
    return NextResponse.json({ error: 'Forbidden: You do not have upload permissions' }, { status: 403 });
  }

  const { id: clientId } = await params;
  const hasAccess = await checkClientAccess(session, clientId);
  if (!hasAccess) {
    await logActivity({
      personId: session.id,
      clientId,
      action: 'upload',
      blocked: true,
      details: `Unassigned staff attempt to upload blocked for client ${clientId}`,
    });
    return NextResponse.json({ error: 'Forbidden: Not assigned to this client' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 4 MB' }, { status: 400 });
    }

    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMime.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, JPG, PNG allowed.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${clientId}/${Date.now()}_${sanitizedName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('client-vault')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: fileRow, error: insertError } = await supabase
      .from('files')
      .insert({
        client_id: clientId,
        uploaded_by_person_id: session.id,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await logActivity({
      personId: session.id,
      fileId: fileRow.id,
      clientId,
      action: 'upload',
      blocked: false,
      details: `Uploaded ${file.name} (${file.size} bytes)`,
    });

    return NextResponse.json({ file: fileRow }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500 });
  }
}
