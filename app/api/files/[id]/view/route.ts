import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse('Unauthorized: Please log in to view files.', { status: 401 });
    }

    const { id: fileId } = await params;
    const supabase = getServiceSupabase();

    // Fetch file record
    const { data: fileRecord, error: fileErr } = await supabase
      .from('files')
      .select('id, client_id, file_name, mime_type, storage_path')
      .eq('id', fileId)
      .single();

    if (fileErr || !fileRecord) {
      return new NextResponse('File record not found in database.', { status: 404 });
    }

    // Role verification:
    // Clients can only access files belonging to their assigned company entity
    if (session.role === 'client') {
      const { data: clientEntity } = await supabase
        .from('clients')
        .select('id')
        .eq('primary_contact_person_id', session.id)
        .eq('id', fileRecord.client_id)
        .single();

      if (!clientEntity) {
        return new NextResponse('Forbidden: You do not have access to this client file.', { status: 403 });
      }
    }

    // Download stream/buffer from Supabase private storage bucket
    const { data: blob, error: downloadError } = await supabase.storage
      .from('client-vault')
      .download(fileRecord.storage_path);

    if (downloadError || !blob) {
      console.error('Private storage download error:', downloadError);
      return new NextResponse('Failed to retrieve file from private storage.', { status: 502 });
    }

    const arrayBuffer = await blob.arrayBuffer();

    // Serve file safely with correct MIME type and inline disposition
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileRecord.mime_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileRecord.file_name)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    console.error('File view error:', err);
    return new NextResponse('Server error while serving file.', { status: 500 });
  }
}

