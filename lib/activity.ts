import { getServiceSupabase } from './supabase';

export interface LogParams {
  personId?: string | null;
  fileId?: string | null;
  clientId?: string | null;
  action: string;
  blocked?: boolean;
  details?: string;
}

export async function logActivity(params: LogParams) {
  try {
    const supabase = getServiceSupabase();
    await supabase.from('activity_log').insert({
      person_id: params.personId || null,
      file_id: params.fileId || null,
      client_id: params.clientId || null,
      action: params.action,
      blocked: !!params.blocked,
      details: params.details || '',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

