import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { profileFromDoc, serializeProfile } from '@/lib/firestore-mappers';
import { verifyAdminRequest } from '@/lib/auth-server';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getDisplayName(uid: string, fallback: string): Promise<string> {
  try {
    const user = await adminAuth.getUser(uid);
    return user.displayName || user.email || fallback;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const displayName = await getDisplayName(auth.uid!, auth.email ?? '');
  const doc = await adminDb.collection('profiles').doc(auth.uid!).get();
  const profile = profileFromDoc(doc);

  if (!profile) {
    return NextResponse.json({ profile: { uid: auth.uid, displayName, images: [], updatedAt: null } });
  }
  return NextResponse.json({ profile: { ...serializeProfile(profile), displayName } });
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  let body: { images?: unknown[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const displayName = await getDisplayName(auth.uid!, auth.email ?? '');
  const images = Array.isArray(body.images) ? body.images : [];

  await adminDb.collection('profiles').doc(auth.uid!).set({
    uid: auth.uid,
    displayName,
    images,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const doc = await adminDb.collection('profiles').doc(auth.uid!).get();
  const profile = profileFromDoc(doc);
  if (!profile) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });

  return NextResponse.json({ profile: { ...serializeProfile(profile), displayName } });
}
