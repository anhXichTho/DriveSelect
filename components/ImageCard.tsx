'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriveImage } from '@/lib/types';

interface Props {
  image: DriveImage;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function ImageCard({ image, selected, onToggle }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <p
        className="truncate px-0.5 text-xs font-medium text-foreground"
        title={image.name}
      >
        {image.name}
      </p>

      <button
        type="button"
        onClick={() => onToggle(image.id)}
        aria-pressed={selected}
        aria-label={`${selected ? 'Bỏ chọn' : 'Chọn'} ảnh ${image.name}`}
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-lg bg-muted transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          selected && 'ring-2 ring-brand-500 ring-offset-2',
        )}
      >
        <Image
          src={image.thumbnailLink}
          alt={image.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            'object-cover transition-opacity duration-150',
            selected ? 'opacity-70' : 'opacity-100',
          )}
          unoptimized
        />

        <div
          className={cn(
            'absolute inset-0 transition-colors duration-150',
            selected ? 'bg-brand-500/20' : 'bg-transparent',
          )}
        />

        <div
          className={cn(
            'absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-150',
            selected
              ? 'bg-brand-500 border-white scale-100'
              : 'bg-white/40 border-white/80 scale-90 backdrop-blur-sm',
          )}
        >
          {selected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
        </div>
      </button>
    </div>
  );
}
