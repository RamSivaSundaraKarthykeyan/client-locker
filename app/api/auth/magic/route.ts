import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceSupabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';

// POST /api/auth/magic: Request a 15-minute single-use magic login link
export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();
  const supabase = getServiceSupabase();

  const { data: person } = await supabase
    .from('people')
    .select('id, email, full_name, role')
    .eq('email', cleanEmail)
    .single();

  if (!person) {
    return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  await supabase.from('magic_links').insert({
    email: cleanEmail,
    token,
    expires_at: expiresAt,
    used: false,
  });

  await logActivity({
    personId: person.id,
    action: 'magic_link_requested',
    blocked: false,
    details: `Magic link created for ${cleanEmail}`,
  });

  const origin = request.nextUrl.origin;
  const magicUrl = `${origin}/login/magic?token=${token}`;

  return NextResponse.json({
    success: true,
    message: 'Magic link generated successfully (valid for 15 minutes, single use).',
    magicUrl, // Returned for testing / clicking directly without relying on an external SMTP provider
  });
}

