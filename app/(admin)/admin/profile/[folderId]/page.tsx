'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  CheckCircle2, Filter, ImageIcon, Loader2, Check,
} from 'lucide-react';
import { useAuth } from '@/components/AuthGuard';
import { ImageCard } from '@/components/ImageCard';
import { ImageLightbox } from '@/components/ImageLightbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DriveImage, ProfileImage } from '@/lib/types';

const PAGE_SIZE = 100;

export default function ProfileBrowsePage({ params }: { params: { folderId: string } }) {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const folderName = searchParams.get('name') || params.folderId;

  const [images, setImages] = useState<DriveImage[] | null>(null);
  const [allProfileImages, setAllProfileImages] = useState<ProfileImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const displayImages = images
    ? (showOnlySelected ? images.filter((img) => selectedIds.has(img.id)) : images)
    : [];
  const totalPages = Math.ceil(displayImages.length / PAGE_SIZE);
  const pagedImages = displayImages.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // Load current profile + folder images
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`/api/folders/${params.folderId}/images`).then((r) => {
        if (!r.ok) throw new Error('Không tải được ảnh');
        return r.json();
      }),
    ])
      .then(([profileData, imagesData]) => {
        if (cancelled) return;
        const profileImgs: ProfileImage[] = profileData.profile?.images ?? [];
        setAllProfileImages(profileImgs);
        const imgs: DriveImage[] = imagesData.images ?? [];
        setImages(imgs);
        // Pre-select images from this folder already in profile
        const alreadySelected = new Set(
          profileImgs
            .filter((p) => p.folderId === params.folderId)
            .map((p) => p.fileId),
        );
        setSelectedIds(alreadySelected);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => { cancelled = true; };
  }, [token, params.folderId]);

  const toggle = useCallback((id: string) => {
    setSaved(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleFilter = () => {
    setShowOnlySelected((v) => !v);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!token || !images) return;
    setSaving(true);
    try {
      // Keep images from other folders, replace images from this folder
      const otherFolderImages = allProfileImages.filter((p) => p.folderId !== params.folderId);
      const thisFolder = images
        .filter((img) => selectedIds.has(img.id))
        .map((img): ProfileImage => ({
          fileId: img.id,
          fileName: img.name,
          thumbnailLink: img.thumbnailLink,
          folderId: params.folderId,
          folderName,
        }));

      const merged = [...otherFolderImages, ...thisFolder];

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: merged }),
      });
      if (!res.ok) throw new Error('Lưu thất bại');

      const data = await res.json();
      setAllProfileImages(data.profile?.images ?? merged);
      setSaved(true);
      toast.success(`Đã lưu ${thisFolder.length} ảnh vào portfolio`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold sm:text-xl">{folderName}</h1>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              Portfolio
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Chọn ảnh mẫu rồi nhấn <b>Lưu vào portfolio</b>
            </p>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={toggleFilter}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  showOnlySelected
                    ? 'bg-brand-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-brand-100 hover:text-brand-700',
                )}
              >
                <Filter className="h-3 w-3" />
                {showOnlySelected ? `Đã chọn (${selectedIds.size})` : `Lọc đã chọn (${selectedIds.size})`}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <div className="font-semibold">Không tải được ảnh</div>
            <div className="mt-1">{error}</div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </div>
        )}

        {!error && images === null && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        )}

        {!error && images && images.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-base font-medium">Thư mục chưa có ảnh nào</p>
          </div>
        )}

        {!error && images && images.length > 0 && displayImages.length === 0 && showOnlySelected && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <Filter className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-base font-medium">Chưa chọn ảnh nào</p>
            <button type="button" onClick={toggleFilter} className="mt-3 text-sm text-brand-600 hover:underline">
              Xem tất cả ảnh
            </button>
          </div>
        )}

        {!error && images && images.length > 0 && displayImages.length > 0 && (
          <div className="flex gap-2 sm:gap-3">
            {/* Pagination sidebar */}
            {totalPages > 1 && (
              <nav
                aria-label="Phân trang"
                className="sticky top-4 self-start flex flex-col gap-1 max-h-[calc(100vh-5rem)] overflow-y-auto shrink-0"
              >
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePageChange(i)}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded text-xs font-medium transition-colors',
                      currentPage === i
                        ? 'bg-brand-500 text-white'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </nav>
            )}

            {/* Grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pagedImages.map((img) => {
                const globalIdx = images.findIndex((i) => i.id === img.id);
                return (
                  <ImageCard
                    key={img.id}
                    image={img}
                    selected={selectedIds.has(img.id)}
                    onToggle={toggle}
                    onOpenLightbox={() => setLightboxIndex(globalIdx)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Save bar */}
      <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
          <div className="text-sm">
            {saved ? (
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Đã lưu vào portfolio
              </div>
            ) : (
              <>
                <div className="font-semibold text-foreground">
                  {selectedIds.size > 0 ? `Đã chọn ${selectedIds.size} ảnh` : 'Chưa chọn ảnh nào'}
                </div>
                <div className="text-xs text-muted-foreground">
                  trong tổng {images?.length ?? 0} ảnh của thư mục này
                </div>
              </>
            )}
          </div>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving || !images}
            className="min-w-[160px]"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu…</>
            ) : saved ? (
              <><Check className="h-4 w-4" /> Lưu lại</>
            ) : (
              'Lưu vào portfolio'
            )}
          </Button>
        </div>
      </div>

      {lightboxIndex !== null && images && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          selectedIds={selectedIds}
          onToggle={toggle}
          onChangeIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
