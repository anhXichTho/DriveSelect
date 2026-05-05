import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { submissionFromDoc, serializeSubmission } from '@/lib/firestore-mappers';
import { verifyAdminRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const snap = await adminDb
    .collection('sessions').doc(params.sessionId)
    .collection('submissions')
    .orderBy('createdAt', 'desc')
    .get();

  const submissions = snap.docs
    .map(submissionFromDoc)
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map(serializeSubmission);

  return NextResponse.json({ submissions });
}
