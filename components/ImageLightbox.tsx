'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  src: string;
  name: string;
  onClose: () => void;
}

export function ImageLightbox({ src, name, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <img
        src={src}
        alt={name}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      <p className="absolute bottom-4 left-0 right-0 px-4 text-center text-sm text-white/70 truncate">
        {name}
      </p>
    </div>
  );
}
