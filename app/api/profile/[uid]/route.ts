import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { profileFromDoc, serializeProfile } from '@/lib/firestore-mappers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { uid: string } },
) {
  let displayName = '';
  try {
    const user = await adminAuth.getUser(params.uid);
    displayName = user.displayName || user.email || '';
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const doc = await adminDb.collection('profiles').doc(params.uid).get();
  const profile = profileFromDoc(doc);

  if (!profile) {
    return NextResponse.json({ profile: { uid: params.uid, displayName, images: [], updatedAt: null } });
  }
  return NextResponse.json({ profile: { ...serializeProfile(profile), displayName } });
}
