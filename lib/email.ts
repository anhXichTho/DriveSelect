import { Resend } from 'resend';
import type { Folder, SelectedFile, Session } from './types';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtml(params: {
  session: Session;
  folder: Folder | null;
  selectedFiles: SelectedFile[];
  detailUrl: string;
}): string {
  const { session, folder, selectedFiles, detailUrl } = params;

  const fileList = selectedFiles
    .map(
      (f, i) =>
        `<li style="margin: 4px 0; color: #1f2937;">${i + 1}. ${escapeHtml(f.name)}</li>`,
    )
    .join('');

  const completedAt = session.completedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(session.completedAt)
    : '—';

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f3f4f6; margin:0; padding:24px;">
  <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
      <div style="width:40px; height:40px; background:#0F9B8E; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; font-weight:700;">D</div>
      <h1 style="margin:0; font-size:20px; color:#111827;">DriveSelect</h1>
    </div>

    <h2 style="margin:0 0 8px; color:#111827; font-size:18px;">Có người vừa hoàn thành chọn ảnh</h2>
    <p style="color:#6b7280; margin:0 0 24px;">${escapeHtml(session.label || 'Không có nhãn')}</p>

    <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
      <tr><td style="padding:6px 0; color:#6b7280; width:120px;">Thư mục:</td><td style="color:#111827; font-weight:500;">${escapeHtml(folder?.name ?? session.folderName)}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Số ảnh chọn:</td><td style="color:#111827; font-weight:500;">${selectedFiles.length}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Thời gian:</td><td style="color:#111827;">${completedAt}</td></tr>
    </table>

    <h3 style="margin:0 0 12px; font-size:14px; color:#111827;">Danh sách ảnh đã chọn</h3>
    <ol style="margin:0 0 24px; padding-left:20px; font-size:14px;">
      ${fileList || '<li style="color:#9ca3af;">(không có ảnh nào)</li>'}
    </ol>

    <a href="${detailUrl}" style="display:inline-block; background:#0F9B8E; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:500;">Xem chi tiết</a>
  </div>
  <p style="text-align:center; color:#9ca3af; font-size:12px; margin-top:16px;">DriveSelect — email tự động</p>
</body></html>`;
}

export async function sendSelectionNotification(params: {
  session: Session;
  folder: Folder | null;
  selectedFiles: SelectedFile[];
}): Promise<{ sent: boolean; error?: string }> {
  const resend = getResend();
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'DriveSelect <onboarding@resend.dev>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!resend) return { sent: false, error: 'RESEND_API_KEY not set' };
  if (!adminEmail) return { sent: false, error: 'ADMIN_EMAIL not set' };

  const detailUrl = `${appUrl.replace(/\/$/, '')}/admin/sessions/${params.session.id}`;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `[DriveSelect] ${params.session.label || params.session.folderName} — ${params.selectedFiles.length} ảnh`,
      html: renderHtml({ ...params, detailUrl }),
    });
    if (result.error) return { sent: false, error: result.error.message };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}
