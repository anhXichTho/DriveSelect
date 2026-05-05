'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  count: number;
  total: number;
  submitting: boolean;
  onSubmit: () => void;
}

export function SubmitBar({ count, total, submitting, onSubmit }: Props) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-border bg-white/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
        <div className="text-sm">
          <div className="font-semibold text-foreground">Đã chọn {count} ảnh</div>
          <div className="text-xs text-muted-foreground">trong tổng {total}</div>
        </div>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={submitting}
          className="min-w-[140px]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang gửi…
            </>
          ) : (
            'Hoàn thành'
          )}
        </Button>
      </div>
    </div>
  );
}
