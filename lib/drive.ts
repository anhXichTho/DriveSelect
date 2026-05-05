import { google } from 'googleapis';
import type { DriveImage } from './types';

export { extractFolderId } from './drive-shared';

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

function getServiceAccountCreds() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_JSON env var. Paste the service account JSON as a single-line string.',
    );
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }
}

let driveClient: ReturnType<typeof google.drive> | null = null;

function getDriveClient() {
  if (driveClient) return driveClient;
  const creds = getServiceAccountCreds();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    scopes: DRIVE_SCOPES,
  });
  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export async function getFolderImages(folderId: string): Promise<DriveImage[]> {
  if (!folderId) throw new Error('folderId is required');
  const drive = getDriveClient();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id,name,thumbnailLink,webViewLink,mimeType)',
    pageSize: 200,
    orderBy: 'name',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = res.data.files ?? [];

  return files
    .filter((f) => f.id && f.thumbnailLink)
    .map((f) => ({
      id: f.id!,
      name: f.name ?? 'untitled',
      thumbnailLink: (f.thumbnailLink ?? '').replace(/=s\d+$/, '=s400'),
      webViewLink: f.webViewLink ?? '',
      mimeType: f.mimeType ?? 'image/jpeg',
    }));
}

export async function getFolderMetadata(folderId: string): Promise<{ name: string } | null> {
  try {
    const drive = getDriveClient();
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id,name,mimeType',
      supportsAllDrives: true,
    });
    return { name: res.data.name ?? 'Untitled folder' };
  } catch {
    return null;
  }
}
