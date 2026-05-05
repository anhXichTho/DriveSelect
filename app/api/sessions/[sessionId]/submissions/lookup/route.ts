import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const { sessionId } = params;
  const name = req.nextUrl.searchParams.get('name')?.trim();
  if (!name) return NextResponse.json({ selectedFiles: [] });

  const snap = await adminDb
    .collection('sessions').doc(sessionId)
    .collection('submissions')
    .where('submitterName', '==', name)
    .limit(1)
    .get();

  if (snap.empty) return NextResponse.json({ selectedFiles: [] });

  const data = snap.docs[0].data();
  return NextResponse.json({ selectedFiles: data.selectedFiles ?? [] });
}
