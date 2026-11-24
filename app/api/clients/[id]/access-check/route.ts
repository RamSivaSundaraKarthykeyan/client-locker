import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkClientAccess } from '@/lib/access';

// GET /api/clients/:id/access-check: Lightweight poll for live vanishing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ hasAccess: false, loggedIn: false }, { status: 401 });
  }

  const { id: clientId } = await params;
  const hasAccess = await checkClientAccess(session, clientId);

  return NextResponse.json({
    hasAccess,
    loggedIn: true,
  });
}
