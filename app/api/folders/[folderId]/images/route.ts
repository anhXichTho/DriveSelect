import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { folderFromDoc } from '@/lib/firestore-mappers';
import { getFolderImages } from '@/lib/drive';
import { unstable_cache } from 'next/cache';

export const runtime = 'nodejs';
export const revalidate = 300;

const getCachedImages = unstable_cache(
  async (driveFolderId: string) => getFolderImages(driveFolderId),
  ['folder-images'],
  { revalidate: 300, tags: ['folder-images'] },
);

export async function GET(
  _req: NextRequest,
  { params }: { params: { folderId: string } },
) {
  const { folderId } = params;
  if (!folderId) {
    return NextResponse.json({ error: 'folderId required' }, { status: 400 });
  }

  const doc = await adminDb.collection('folders').doc(folderId).get();
  const folder = folderFromDoc(doc);
  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  try {
    const images = await getCachedImages(folder.folderId);
    return NextResponse.json({ images });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Drive API error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
