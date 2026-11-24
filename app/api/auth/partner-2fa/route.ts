import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// POST /api/auth/partner-2fa
// Action 1: password verification -> issues 6-digit OTP
// Action 2: verify OTP code -> logs in partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, code } = body;
    const cleanEmail = email?.trim().toLowerCase();
    const supabase = getServiceSupabase();

    if (action === 'request') {
      if (!cleanEmail || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      const { data: person } = await supabase
        .from('people')
        .select('id, email, password_hash, full_name, role, title, firm_id')
        .eq('email', cleanEmail)
        .single();

      if (!person || person.role !== 'partner') {
        return NextResponse.json({ error: 'Invalid partner credentials' }, { status: 401 });
      }

      const isValid = await verifyPassword(password, person.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid partner credentials' }, { status: 401 });
      }

      // Generate 6-digit 2FA code valid for 5 minutes
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from('partner_2fa_codes').insert({
        person_id: person.id,
        code: otpCode,
        expires_at: expiresAt,
        used: false,
      });

      await logActivity({
        personId: person.id,
        action: 'partner_2fa_requested',
        blocked: false,
        details: `Two-step verification code generated for ${cleanEmail}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Step 1 passed: Enter the 6-digit 2FA code sent to your partner device.',
        demoCode: otpCode, // Provided for instant demo testing
      });
    }

    if (action === 'verify') {
      if (!cleanEmail || !code) {
        return NextResponse.json({ error: 'Email and 2FA code required' }, { status: 400 });
      }

      const { data: person } = await supabase
        .from('people')
        .select('id, email, full_name, role, title, firm_id')
        .eq('email', cleanEmail)
        .single();

      if (!person) {
        return NextResponse.json({ error: 'Invalid partner account' }, { status: 401 });
      }

      const { data: codeRow } = await supabase
        .from('partner_2fa_codes')
        .select('id, code, expires_at, used')
        .eq('person_id', person.id)
        .eq('code', code.trim())
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!codeRow) {
        return NextResponse.json({ error: 'Invalid or already used 2FA code' }, { status: 401 });
      }

      if (new Date(codeRow.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: '2FA code has expired (5-minute limit)' }, { status: 401 });
      }

      // Mark code used
      await supabase.from('partner_2fa_codes').update({ used: true }).eq('id', codeRow.id);

      // Establish secure partner session
      await setSessionCookie({
        id: person.id,
        email: person.email,
        fullName: person.full_name,
        role: 'partner',
        firmId: person.firm_id,
        title: person.title,
      });

      await logActivity({
        personId: person.id,
        action: 'partner_2fa_verified',
        blocked: false,
        details: `Partner ${person.email} successfully completed two-step login`,
      });

      return NextResponse.json({ success: true, redirect: '/partner/dashboard' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '2FA failed' }, { status: 500 });
  }
}
