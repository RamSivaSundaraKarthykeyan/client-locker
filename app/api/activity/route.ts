import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/activity: Partners read the log, newest first. Staff/auditors/clients get 403.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'partner') {
    return NextResponse.json({ error: 'Forbidden: Only partners can read the activity log' }, { status: 403 });
  }

  const supabase = getServiceSupabase();
  const { data: logs, error } = await supabase
    .from('activity_log')
    .select(`
      id,
      action,
      blocked,
      details,
      created_at,
      person:people!activity_log_person_id_fkey(id, full_name, email, role),
      client:clients!activity_log_client_id_fkey(id, name),
      file:files!activity_log_file_id_fkey(id, file_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: logs || [] });
}

