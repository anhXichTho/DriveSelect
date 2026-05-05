import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  folderFromDoc,
  serializeFolder,
  serializeSession,
  sessionFromDoc,
} from '@/lib/firestore-mappers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const { sessionId } = params;
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const sessionDoc = await adminDb.collection('sessions').doc(sessionId).get();
  const session = sessionFromDoc(sessionDoc);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  let folder = null;
  if (session.folderId) {
    const folderDoc = await adminDb.collection('folders').doc(session.folderId).get();
    folder = folderFromDoc(folderDoc);
  }

  return NextResponse.json({
    session: serializeSession(session),
    folder: folder ? serializeFolder(folder) : null,
  });
}
