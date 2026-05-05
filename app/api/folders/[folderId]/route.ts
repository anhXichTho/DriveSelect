import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { folderId: string } },
) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { folderId } = params;
  if (!folderId) {
    return NextResponse.json({ error: 'folderId required' }, { status: 400 });
  }

  await adminDb.collection('folders').doc(folderId).delete();
  return NextResponse.json({ success: true });
}
