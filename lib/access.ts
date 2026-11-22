import { getServiceSupabase } from './supabase';
import { AuthSession } from './auth';

/**
 * Server-side access enforcement:
 * - Partner: Can access any client.
 * - Staff / Auditor: Can access only if they have an active row in client_access.
 * - Client: Can access only their own client company entity (where primary_contact_person_id == user.id).
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
      .select('id')
      .eq('client_id', clientId)
      .eq('person_id', session.id)
      .single();
    return !!data;
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

