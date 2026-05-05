import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { folderFromDoc, serializeFolder } from '@/lib/firestore-mappers';
import { extractFolderId } from '@/lib/drive';
import { verifyAdminRequest } from '@/lib/auth-server';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

  const snap = await adminDb.collection('folders').orderBy('createdAt', 'desc').get();
  const all = snap.docs.map(folderFromDoc).filter((f): f is NonNullable<typeof f> => f !== null);
  const folders = (auth.isOwner ? all : all.filter((f) => f.createdByUid === auth.uid)).map(serializeFolder);

  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string; driveUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = (body.name ?? '').trim();
  const driveUrl = (body.driveUrl ?? '').trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!driveUrl) return NextResponse.json({ error: 'driveUrl is required' }, { status: 400 });

  const folderId = extractFolderId(driveUrl);
  if (!folderId) {
    return NextResponse.json(
      { error: 'Không nhận diện được folder ID từ URL. Hãy kiểm tra lại link.' },
      { status: 400 },
    );
  }

  const ref = await adminDb.collection('folders').add({
    name,
    driveUrl,
    folderId,
    createdAt: FieldValue.serverTimestamp(),
    createdByUid: auth.uid ?? '',
  });

  const doc = await ref.get();
  const folder = folderFromDoc(doc);
  if (!folder) return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });

  return NextResponse.json({ folder: serializeFolder(folder) }, { status: 201 });
}
