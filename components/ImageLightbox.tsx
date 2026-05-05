'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriveImage } from '@/lib/types';

interface Props {
  images: DriveImage[];
  currentIndex: number;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
}

export function ImageLightbox({ images, currentIndex, selectedIds, onToggle, onChangeIndex, onClose }: Props) {
  const image = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;
  const isSelected = selectedIds.has(image.id);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onChangeIndex(currentIndex - 1);
      if (e.key === 'ArrowRight' && hasNext) onChangeIndex(currentIndex + 1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, onChangeIndex, currentIndex, hasPrev, hasNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <p className="text-sm text-white/80 truncate max-w-[60%]">{image.name}</p>
        <div className="flex items-center gap-3 shrink-0 pointer-events-auto">
          <span className="text-xs text-white/50">{currentIndex + 1} / {images.length}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Prev */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChangeIndex(currentIndex - 1); }}
          aria-label="Ảnh trước"
          className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={`/api/download/${image.id}?preview=1`}
        alt={image.name}
        className="max-h-[78vh] max-w-[80vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChangeIndex(currentIndex + 1); }}
          aria-label="Ảnh tiếp"
          className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Select button */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onToggle(image.id)}
          className={cn(
            'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all',
            isSelected
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
              : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm',
          )}
        >
          <Check className="h-4 w-4" strokeWidth={isSelected ? 3 : 2} />
          {isSelected ? 'Đã chọn · Bỏ chọn' : 'Chọn ảnh này'}
        </button>
      </div>
    </div>
  );
}
