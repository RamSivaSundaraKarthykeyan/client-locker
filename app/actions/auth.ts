'use server';

import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyPassword, setSessionCookie, clearSessionCookie, getSession } from '@/lib/auth';

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function loginAction(prevState: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  try {
    const supabase = getServiceSupabase();
    const { data: person, error } = await supabase
      .from('people')
      .select('id, email, password_hash, full_name, role, title, firm_id')
      .eq('email', email)
      .single();

    if (error || !person) {
      return { error: 'Invalid email or password.' };
    }

    const isValid = await verifyPassword(password, person.password_hash);
    if (!isValid) {
      return { error: 'Invalid email or password.' };
    }

    // Set HTTP-only secure session cookie with role calculated on server
    await setSessionCookie({
      id: person.id,
      email: person.email,
      fullName: person.full_name,
      role: person.role,
      firmId: person.firm_id,
      title: person.title,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return { error: `Authentication failed: ${message}` };
  }

  // Redirect based on server-verified role
  const session = await getSession();
  if (session?.role === 'partner') {
    redirect('/partner/dashboard');
  } else if (session?.role === 'staff') {
    redirect('/staff/dashboard');
  } else {
    redirect('/client/dashboard');
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}

