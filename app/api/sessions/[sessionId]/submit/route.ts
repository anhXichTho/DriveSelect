import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { folderFromDoc, sessionFromDoc, serializeSubmission, submissionFromDoc } from '@/lib/firestore-mappers';
import { sendSelectionNotification } from '@/lib/email';
import { FieldValue } from 'firebase-admin/firestore';
import type { SelectedFile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const { sessionId } = params;

  let body: { selectedFiles?: SelectedFile[]; submitterName?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const submitterName = (body.submitterName ?? '').trim();
  if (!submitterName) return NextResponse.json({ error: 'Vui lòng nhập tên của bạn.' }, { status: 400 });

  const raw = Array.isArray(body.selectedFiles) ? body.selectedFiles : [];
  if (raw.length === 0) return NextResponse.json({ error: 'Vui lòng chọn ít nhất 1 ảnh.' }, { status: 400 });

  const selectedFiles: SelectedFile[] = raw
    .map((f) => ({ id: typeof f.id === 'string' ? f.id : '', name: typeof f.name === 'string' ? f.name : '' }))
    .filter((f) => f.id);

  // Verify session exists
  const sessionSnap = await adminDb.collection('sessions').doc(sessionId).get();
  const session = sessionFromDoc(sessionSnap);
  if (!session) return NextResponse.json({ error: 'Link không hợp lệ' }, { status: 404 });

  // Create submission sub-document
  const subRef = await adminDb
    .collection('sessions').doc(sessionId)
    .collection('submissions').add({
      sessionId,
      submitterName,
      selectedFiles,
      createdAt: FieldValue.serverTimestamp(),
    });

  // Update session: mark active + increment count
  await adminDb.collection('sessions').doc(sessionId).update({
    status: 'active',
    submissionCount: FieldValue.increment(1),
    lastSubmittedAt: FieldValue.serverTimestamp(),
  });

  const subDoc = await subRef.get();
  const submission = submissionFromDoc(subDoc);

  // Send email async
  if (submission) {
    let folder = null;
    if (session.folderId) {
      const folderDoc = await adminDb.collection('folders').doc(session.folderId).get();
      folder = folderFromDoc(folderDoc);
    }
    sendSelectionNotification({
      session: { ...session, label: `${session.label || session.folderName} — ${submitterName}` },
      folder,
      selectedFiles,
    }).catch((e) => console.error('Email failed:', e));
  }

  return NextResponse.json({
    success: true,
    submission: submission ? serializeSubmission(submission) : null,
  });
}
