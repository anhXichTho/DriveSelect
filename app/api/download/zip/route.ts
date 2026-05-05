import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import JSZip from 'jszip';
import type { SelectedFile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getDriveClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
  const creds = JSON.parse(raw);
  if (typeof creds.private_key === 'string') {
    creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  }
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: creds.client_email, private_key: creds.private_key },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

async function downloadFileBuffer(drive: ReturnType<typeof google.drive>, fileId: string): Promise<Buffer> {
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' },
  );
  const stream = res.data as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export async function POST(req: NextRequest) {
  let body: { files?: SelectedFile[]; zipName?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const files = body.files ?? [];
  if (files.length === 0) return NextResponse.json({ error: 'Không có file nào' }, { status: 400 });
  if (files.length > 200) return NextResponse.json({ error: 'Tối đa 200 file' }, { status: 400 });

  const zipName = (body.zipName ?? 'anh-da-chon').replace(/[^a-zA-Z0-9\-_\s]/g, '').trim() || 'anh-da-chon';

  try {
    const drive = getDriveClient();
    const zip = new JSZip();

    await Promise.all(
      files.map(async (f) => {
        try {
          const buf = await downloadFileBuffer(drive, f.id);
          zip.file(f.name, buf);
        } catch {
          // Skip files that fail silently
        }
      }),
    );

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 3 },
    });

    const encodedName = encodeURIComponent(`${zipName}.zip`);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
        'Content-Length': String(zipBuffer.byteLength),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lỗi tạo ZIP' }, { status: 500 });
  }
}
