import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { folderFromDoc } from '@/lib/firestore-mappers';
import { getFolderImages } from '@/lib/drive';
import { unstable_cache } from 'next/cache';

export const runtime = 'nodejs';
export const revalidate = 300;

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
    const getCachedImages = unstable_cache(
      () => getFolderImages(folder.folderId),
      ['folder-images', folder.folderId],
      { revalidate: 300, tags: [`folder-images-${folder.folderId}`] },
    );
    const images = await getCachedImages();
    return NextResponse.json({ images });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Drive API error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
