import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const GUEST_COOKIE = 'yoga_guest_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function getSessionSecret(): string | null {
  const secret =
    process.env.GUEST_SESSION_SECRET?.trim() ||
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

export function isGuestSessionConfigured(): boolean {
  return Boolean(getSessionSecret());
}

export async function createGuestSession(guestId: string): Promise<void> {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error('Guest session secret is not configured.');
  }

  const encodedGuestId = Buffer.from(guestId).toString('base64url');
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = `guest.${encodedGuestId}.${expiresAt}`;
  const token = `${payload}.${sign(payload, secret)}`;
  const cookieStore = await cookies();

  cookieStore.set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteGuestSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
}

export async function verifyGuestSession(): Promise<{ guestId: string } | null> {
  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  const token = (await cookies()).get(GUEST_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const [role, encodedGuestId, expiresAt, signature] = token.split('.');

  if (role !== 'guest' || !encodedGuestId || !expiresAt || !signature) {
    return null;
  }

  const expiry = Number(expiresAt);

  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    return null;
  }

  if (!safeEqual(signature, sign(`${role}.${encodedGuestId}.${expiresAt}`, secret))) {
    return null;
  }

  return { guestId: Buffer.from(encodedGuestId, 'base64url').toString() };
}
