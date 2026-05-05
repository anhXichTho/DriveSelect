'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Eye, ImageIcon, Loader2 } from 'lucide-react';
import { ImageLightbox } from '@/components/ImageLightbox';
import type { ProfileImage, DriveImage } from '@/lib/types';

interface PublicProfile {
  uid: string;
  displayName: string;
  images: ProfileImage[];
  updatedAt: string | null;
}

function todriveImage(p: ProfileImage): DriveImage {
  return {
    id: p.fileId,
    name: p.fileName,
    thumbnailLink: p.thumbnailLink,
    webViewLink: '',
    mimeType: 'image/jpeg',
  };
}

export default function PublicPortfolioPage({ params }: { params: { uid: string } }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/profile/${params.uid}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error('Không tải được');
        const data = await res.json();
        setProfile(data.profile);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.uid]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center p-6">
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Không tìm thấy portfolio</p>
        <p className="text-sm text-muted-foreground">Link không hợp lệ hoặc portfolio chưa được tạo.</p>
      </div>
    );
  }

  const driveImages = profile.images.map(todriveImage);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-white px-4 py-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 mb-3">
          <span className="text-xl font-bold text-white">
            {profile.displayName.charAt(0).toUpperCase() || 'P'}
          </span>
        </div>
        <h1 className="text-xl font-bold">{profile.displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.images.length} ảnh mẫu
        </p>
      </header>

      {/* Gallery */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {profile.images.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-base font-medium">Chưa có ảnh nào</p>
            <p className="mt-1 text-sm text-muted-foreground">Portfolio này chưa được cập nhật.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {profile.images.map((img, idx) => (
              <div key={img.fileId} className="group relative">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  <Image
                    src={img.thumbnailLink}
                    alt={img.fileName}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {lightboxIndex !== null && driveImages.length > 0 && (
        <ImageLightbox
          images={driveImages}
          currentIndex={lightboxIndex}
          selectedIds={new Set()}
          onToggle={() => {}}
          onChangeIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          readonly
        />
      )}
    </div>
  );
}
