import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SelectedFile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string; submissionId: string } },
) {
  const { sessionId, submissionId } = params;

  let body: { selectedFiles?: SelectedFile[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const raw = Array.isArray(body.selectedFiles) ? body.selectedFiles : [];
  if (raw.length === 0) return NextResponse.json({ error: 'selectedFiles required' }, { status: 400 });

  const selectedFiles: SelectedFile[] = raw.map((f) => ({
    id: typeof f.id === 'string' ? f.id : '',
    name: typeof f.name === 'string' ? f.name : '',
    ...(typeof f.note === 'string' && f.note.trim() ? { note: f.note.trim().slice(0, 500) } : {}),
  })).filter((f) => f.id);

  const ref = adminDb
    .collection('sessions').doc(sessionId)
    .collection('submissions').doc(submissionId);

  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  await ref.update({ selectedFiles, updatedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ success: true });
}
