import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import { sessionFromDoc } from '@/lib/firestore-mappers';
import { ImageGrid } from '@/components/ImageGrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Chọn ảnh — DriveSelect' };

export default async function SelectPage({ params }: { params: { sessionId: string } }) {
  const doc = await adminDb.collection('sessions').doc(params.sessionId).get();
  const session = sessionFromDoc(doc);
  if (!session) notFound();

  return (
    <ImageGrid
      sessionId={session.id}
      folderId={session.folderId}
      folderName={session.folderName}
      label={session.label}
    />
  );
}
