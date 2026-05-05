import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { folderFromDoc, serializeSession, sessionFromDoc } from '@/lib/firestore-mappers';
import { verifyAdminRequest } from '@/lib/auth-server';
import { FieldValue } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const snap = await adminDb.collection('sessions').orderBy('createdAt', 'desc').get();
  const sessions = snap.docs
    .map(sessionFromDoc)
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map(serializeSession);

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  let body: { folderId?: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const folderId = (body.folderId ?? '').trim();
  const label = (body.label ?? '').trim();
  if (!folderId) return NextResponse.json({ error: 'folderId is required' }, { status: 400 });

  const folderDoc = await adminDb.collection('folders').doc(folderId).get();
  const folder = folderFromDoc(folderDoc);
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

  const sessionId = nanoid(10);

  await adminDb.collection('sessions').doc(sessionId).set({
    folderId: folder.id,
    folderName: folder.name,
    label,
    status: 'pending',
    selectedFiles: [],
    completedAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  const created = await adminDb.collection('sessions').doc(sessionId).get();
  const session = sessionFromDoc(created);
  if (!session) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });

  return NextResponse.json({ session: serializeSession(session) }, { status: 201 });
}
