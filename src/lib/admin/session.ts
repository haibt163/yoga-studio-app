import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'yoga_admin_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getSessionSecret(): string | null {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim();

  return secret || null;
}

function safeEqual(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function isAdminLoginConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME?.trim() || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!expectedPassword) {
    return false;
  }

  const usernameMatches = safeEqual(username, expectedUsername);
  const passwordMatches = safeEqual(password, expectedPassword);

  return usernameMatches && passwordMatches;
}

export async function createAdminSession(): Promise<void> {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error('Admin session secret is not configured.');
  }

  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = `admin.${expiresAt}`;
  const token = `${payload}.${sign(payload, secret)}`;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function verifyAdminSession(): Promise<boolean> {
  const secret = getSessionSecret();

  if (!secret) {
    return false;
  }

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;

  if (!token) {
    return false;
  }

  const [role, expiresAt, signature] = token.split('.');

  if (role !== 'admin' || !expiresAt || !signature) {
    return false;
  }

  const expiry = Number(expiresAt);

  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    return false;
  }

  return safeEqual(signature, sign(`${role}.${expiresAt}`, secret));
}
