'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export interface UploadActionResult {
  error?: string;
  success?: boolean;
}

export async function uploadClientFile(
  clientId: string,
  formData: FormData
): Promise<UploadActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized. Please log in.' };
  }

  // Only partner and staff can upload in this flow
  if (session.role !== 'partner' && session.role !== 'staff') {
    return { error: 'Permission denied. Only firm members can upload client files.' };
  }

  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { error: 'Please choose a valid file to upload.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: 'File size exceeds maximum limit of 4 MB.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: 'Invalid file format. Only PDF, JPG, and PNG files are accepted.' };
  }

  try {
    const supabase = getServiceSupabase();

    // Verify client exists
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return { error: 'Client not found.' };
    }

    // Unique storage path in private bucket
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${clientId}/${Date.now()}_${sanitizedFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload to Supabase private storage bucket 'client-vault'
    const { error: uploadError } = await supabase.storage
      .from('client-vault')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { error: `Storage upload failed: ${uploadError.message}` };
    }

    // 2. Insert record into 'files' table
    const { error: insertError } = await supabase.from('files').insert({
      client_id: clientId,
      uploaded_by_person_id: session.id,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      storage_path: storagePath,
    });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return { error: `Database error saving file record: ${insertError.message}` };
    }

    revalidatePath(`/staff/clients/${clientId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('File upload exception:', err);
    return { error: err instanceof Error ? err.message : 'Unknown upload error' };
  }
}

