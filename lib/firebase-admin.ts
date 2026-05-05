import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;

function getCredentials() {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) {
    throw new Error(
      'Missing FIREBASE_ADMIN_CREDENTIALS env var. Paste the service account JSON as a single-line string.',
    );
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch {
    throw new Error('FIREBASE_ADMIN_CREDENTIALS is not valid JSON.');
  }
}

function ensureApp(): App {
  if (_app) return _app;
  const existing = getApps();
  if (existing.length) {
    _app = existing[0]!;
    return _app;
  }
  _app = initializeApp({ credential: cert(getCredentials()) });
  return _app;
}

export const adminDb = new Proxy({} as Firestore, {
  get(_t, prop) {
    const target = getFirestore(ensureApp(), 'driveselect') as unknown as Record<PropertyKey, unknown>;
    const value = target[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
}) as Firestore;

export const adminAuth = new Proxy({} as Auth, {
  get(_t, prop) {
    const target = getAuth(ensureApp()) as unknown as Record<PropertyKey, unknown>;
    const value = target[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
}) as Auth;
