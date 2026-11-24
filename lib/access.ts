import { getServiceSupabase } from './supabase';
import { AuthSession } from './auth';

/**
 * Server-side access enforcement (M5 Enhanced):
 * - Partner: Can access any client.
 * - Staff / Auditor: Can access only if they have an active row in client_access
 *   AND the access has not passed its set expiration date (expires_at is null or in the future).
 * - Client: Can access only their own client company entity.
 * Returns true if allowed, false if blocked.
 */
export async function checkClientAccess(
  session: AuthSession | null,
  clientId: string
): Promise<boolean> {
  if (!session) return false;
  if (session.role === 'partner') return true;

  const supabase = getServiceSupabase();

  if (session.role === 'staff' || session.role === 'auditor') {
    const { data } = await supabase
      .from('client_access')
      .select('id, expires_at')
      .eq('client_id', clientId)
      .eq('person_id', session.id)
      .single();

    if (!data) return false;

    // Check if access has a set expiration date that has already passed
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return false;
    }

    return true;
  }

  if (session.role === 'client') {
    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('primary_contact_person_id', session.id)
      .single();
    return !!data;
  }

  return false;
}
