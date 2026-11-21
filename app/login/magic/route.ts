import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { setSessionCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// GET /login/magic?token=xyz
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=Invalid+magic+link', request.url));
  }

  const supabase = getServiceSupabase();
  const { data: magicRow } = await supabase
    .from('magic_links')
    .select('id, email, expires_at, used')
    .eq('token', token)
    .single();

  if (!magicRow || magicRow.used) {
    return NextResponse.redirect(new URL('/login?error=Magic+link+already+used+or+invalid', request.url));
  }

  if (new Date(magicRow.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL('/login?error=Magic+link+expired+(15-minute+limit)', request.url));
  }

  // Mark token as used
  await supabase.from('magic_links').update({ used: true }).eq('id', magicRow.id);

  // Fetch person
  const { data: person } = await supabase
    .from('people')
    .select('id, email, full_name, role, firm_id, title')
    .eq('email', magicRow.email)
    .single();

  if (!person) {
    return NextResponse.redirect(new URL('/login?error=User+not+found', request.url));
  }

  await setSessionCookie({
    id: person.id,
    email: person.email,
    fullName: person.full_name,
    role: person.role,
    firmId: person.firm_id,
    title: person.title,
  });

  await logActivity({
    personId: person.id,
    action: 'magic_login',
    blocked: false,
    details: `User ${person.email} logged in via single-use magic link`,
  });

  if (person.role === 'partner') {
    return NextResponse.redirect(new URL('/partner/dashboard', request.url));
  } else if (person.role === 'staff') {
    return NextResponse.redirect(new URL('/staff/dashboard', request.url));
  } else if (person.role === 'auditor') {
    return NextResponse.redirect(new URL('/auditor/dashboard', request.url));
  } else {
    return NextResponse.redirect(new URL('/client/dashboard', request.url));
  }
}
