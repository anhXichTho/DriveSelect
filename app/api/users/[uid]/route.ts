import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { uid: string } },
) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!auth.isOwner) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });

  let body: { disabled?: boolean; password?: string; displayName?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const update: Record<string, unknown> = {};
  if (typeof body.disabled === 'boolean') update.disabled = body.disabled;
  if (body.password && body.password.length >= 6) update.password = body.password;
  if (typeof body.displayName === 'string') update.displayName = body.displayName;

  try {
    await adminAuth.updateUser(params.uid, update);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Cập nhật thất bại' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { uid: string } },
) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!auth.isOwner) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });

  // Không cho xóa chính mình
  if (auth.uid === params.uid) {
    return NextResponse.json({ error: 'Không thể xóa tài khoản đang đăng nhập' }, { status: 400 });
  }

  try {
    await adminAuth.deleteUser(params.uid);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Xóa thất bại' }, { status: 400 });
  }
}
