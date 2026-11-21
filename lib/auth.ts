import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export type UserRole = 'partner' | 'staff' | 'client' | 'auditor';

export interface AuthSession {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  firmId?: string;
  title?: string;
}

const SESSION_COOKIE_NAME = 'cl_session';

export function signSession(session: AuthSession): string {
  const payload = JSON.stringify({
    ...session,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return Buffer.from(payload).toString('base64url');
}

export function parseSession(token: string): AuthSession | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const data = JSON.parse(raw);
    if (!data.id || !data.role || (data.exp && Date.now() > data.exp)) {
      return null;
    }
    return {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role as UserRole,
      firmId: data.firmId,
      title: data.title,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return parseSession(token);
}

export async function setSessionCookie(session: AuthSession): Promise<void> {
  const cookieStore = await cookies();
  const token = signSession(session);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
