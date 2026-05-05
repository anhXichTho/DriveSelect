'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriveImage } from '@/lib/types';

interface Props {
  images: DriveImage[];
  currentIndex: number;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
  readonly?: boolean;
}

function dist(t1: React.Touch, t2: React.Touch) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

export function ImageLightbox({ images, currentIndex, selectedIds, onToggle, onChangeIndex, onClose, readonly = false }: Props) {
  const image = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;
  const isSelected = selectedIds.has(image.id);

  const [src, setSrc] = useState(image.thumbnailLink);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // mouse drag
  const isDragging = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // touch state
  const touchRef = useRef({
    lastDist: 0,
    baseZoom: 1,
    lastTap: 0,
    singleStart: { mx: 0, my: 0, px: 0, py: 0 },
    swipeStartX: 0,
    isSwiping: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Load ảnh gốc, hiện thumbnail ngay
  useEffect(() => {
    setSrc(image.thumbnailLink);
    setIsLoading(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const img = new window.Image();
    const fullSrc = `/api/download/${image.id}?preview=1`;
    img.onload = () => { setSrc(fullSrc); setIsLoading(false); };
    img.onerror = () => setIsLoading(false);
    img.src = fullSrc;
    return () => { img.onload = null; img.onerror = null; };
  }, [image.id, image.thumbnailLink]);

  const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const navigate = useCallback((dir: number) => {
    resetZoom();
    onChangeIndex(currentIndex + dir);
  }, [resetZoom, onChangeIndex, currentIndex]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { zoom > 1 ? resetZoom() : onClose(); return; }
      if (zoom <= 1) {
        if (e.key === 'ArrowLeft' && hasPrev) navigate(-1);
        if (e.key === 'ArrowRight' && hasNext) navigate(1);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, navigate, zoom, resetZoom, hasPrev, hasNext]);

  // Scroll wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(prev => {
        const next = prev * (e.deltaY < 0 ? 1.1 : 0.9);
        const clamped = Math.max(1, Math.min(6, next));
        if (clamped === 1) setPan({ x: 0, y: 0 });
        return clamped;
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Mouse handlers
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    zoom > 1 ? resetZoom() : setZoom(2.5);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault(); e.stopPropagation();
    isDragging.current = true;
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: dragOrigin.current.px + (e.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.py + (e.clientY - dragOrigin.current.my),
    });
  };

  const handleMouseUp = () => { isDragging.current = false; };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();

    if (e.touches.length === 1) {
      const t = e.touches[0];

      // Double-tap zoom
      const now = Date.now();
      if (now - touchRef.current.lastTap < 280) {
        touchRef.current.lastTap = 0;
        zoom > 1 ? resetZoom() : setZoom(2.5);
        return;
      }
      touchRef.current.lastTap = now;

      // Single-finger pan (when zoomed) or swipe (when not zoomed)
      touchRef.current.singleStart = { mx: t.clientX, my: t.clientY, px: pan.x, py: pan.y };
      touchRef.current.swipeStartX = t.clientX;
      touchRef.current.isSwiping = zoom <= 1;
    }

    if (e.touches.length === 2) {
      touchRef.current.lastDist = dist(e.touches[0], e.touches[1]);
      touchRef.current.baseZoom = zoom;
      touchRef.current.isSwiping = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 2) {
      const d = dist(e.touches[0], e.touches[1]);
      const newZoom = Math.max(1, Math.min(6, touchRef.current.baseZoom * (d / touchRef.current.lastDist)));
      setZoom(newZoom);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return;
    }

    if (e.touches.length === 1 && zoom > 1) {
      const t = e.touches[0];
      setPan({
        x: touchRef.current.singleStart.px + (t.clientX - touchRef.current.singleStart.mx),
        y: touchRef.current.singleStart.py + (t.clientY - touchRef.current.singleStart.my),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length > 0) return;

    // Swipe navigation when not zoomed
    if (touchRef.current.isSwiping) {
      const dx = (e.changedTouches[0]?.clientX ?? 0) - touchRef.current.swipeStartX;
      if (dx < -50 && hasNext) navigate(1);
      else if (dx > 50 && hasPrev) navigate(-1);
    }
    touchRef.current.isSwiping = false;
  };

  const imgStyle: React.CSSProperties = {
    maxHeight: '80vh',
    maxWidth: '88vw',
    objectFit: 'contain',
    display: 'block',
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: 'center',
    transition: isDragging.current ? 'none' : 'transform 0.15s ease',
    cursor: zoom > 1 ? 'grab' : 'zoom-in',
    userSelect: 'none',
    touchAction: 'none',
    borderRadius: '8px',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.7), 0 32px 80px rgba(0,0,0,0.5)',
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={() => zoom <= 1 && onClose()}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-white/80 truncate max-w-[50%]">{image.name}</p>
        <div className="flex items-center gap-2 shrink-0">
          {isLoading && <span className="text-xs text-white/40">Đang tải…</span>}
          {!isLoading && zoom > 1 && (
            <button
              type="button"
              onClick={resetZoom}
              className="text-xs text-white/60 hover:text-white/90 px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              {zoom.toFixed(1)}× · Đặt lại
            </button>
          )}
          <span className="text-xs text-white/40">{currentIndex + 1} / {images.length}</span>
          <a
            href={`/api/download/${image.id}?name=${encodeURIComponent(image.name)}`}
            download={image.name}
            aria-label="Tải ảnh"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Prev */}
      {hasPrev && zoom <= 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          aria-label="Ảnh trước"
          className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={src}
        alt={image.name}
        draggable={false}
        style={imgStyle}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Next */}
      {hasNext && zoom <= 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(1); }}
          aria-label="Ảnh tiếp"
          className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Select button */}
      {!readonly && zoom <= 1 && (
        <div
          className="absolute bottom-6 left-0 right-0 flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
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
      )}
    </div>
  );
}
