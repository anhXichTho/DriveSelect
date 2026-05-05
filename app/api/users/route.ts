import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const list = await adminAuth.listUsers(1000);
  const users = list.users.map((u) => ({
    uid: u.uid,
    email: u.email ?? '',
    displayName: u.displayName ?? '',
    disabled: u.disabled,
    createdAt: u.metadata.creationTime,
    lastSignIn: u.metadata.lastSignInTime ?? null,
  }));
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  let body: { email?: string; password?: string; displayName?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const email = (body.email ?? '').trim();
  const password = (body.password ?? '').trim();
  const displayName = (body.displayName ?? '').trim();

  if (!email) return NextResponse.json({ error: 'Email là bắt buộc' }, { status: 400 });
  if (!password || password.length < 6) return NextResponse.json({ error: 'Mật khẩu tối thiểu 6 ký tự' }, { status: 400 });

  try {
    const user = await adminAuth.createUser({ email, password, displayName: displayName || undefined });
    return NextResponse.json({
      user: { uid: user.uid, email: user.email, displayName: user.displayName ?? '' }
    }, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code ?? '';
    const msg = code === 'auth/email-already-exists'
      ? 'Email này đã được sử dụng'
      : (e instanceof Error ? e.message : 'Tạo user thất bại');
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
