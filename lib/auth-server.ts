import { adminAuth } from './firebase-admin';
import type { NextRequest } from 'next/server';

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? '';

export async function verifyAdminRequest(req: NextRequest): Promise<{
  ok: boolean;
  uid?: string;
  email?: string;
  isOwner?: boolean;
  error?: string;
}> {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header) return { ok: false, error: 'Missing Authorization header' };

  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, error: 'Malformed Authorization header' };

  try {
    const decoded = await adminAuth.verifyIdToken(m[1]!);
    const isOwner = !!OWNER_EMAIL && decoded.email === OWNER_EMAIL;
    return { ok: true, uid: decoded.uid, email: decoded.email, isOwner };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Token verification failed' };
  }
}
