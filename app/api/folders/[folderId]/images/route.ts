import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { folderFromDoc } from '@/lib/firestore-mappers';
import { getFolderImages } from '@/lib/drive';
import type { DriveImage } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory cache per Drive folder ID, TTL 5 phút
const cache = new Map<string, { data: DriveImage[]; ts: number }>();
const TTL = 5 * 60 * 1000;

async function getCached(driveFolderId: string): Promise<DriveImage[]> {
  const hit = cache.get(driveFolderId);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  const data = await getFolderImages(driveFolderId);
  cache.set(driveFolderId, { data, ts: Date.now() });
  return data;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { folderId: string } },
) {
  const { folderId } = params;
  if (!folderId) return NextResponse.json({ error: 'folderId required' }, { status: 400 });

  const doc = await adminDb.collection('folders').doc(folderId).get();
  const folder = folderFromDoc(doc);
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

  try {
    const images = await getCached(folder.folderId);
    return NextResponse.json({ images });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Drive API error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
