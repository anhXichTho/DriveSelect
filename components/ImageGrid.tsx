'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ImageIcon, User } from 'lucide-react';
import type { DriveImage } from '@/lib/types';
import { ImageCard } from './ImageCard';
import { SubmitBar } from './SubmitBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  sessionId: string;
  folderId: string;
  folderName: string;
  label: string;
}

export function ImageGrid({ sessionId, folderId, folderName, label }: Props) {
  const [step, setStep] = useState<'name' | 'select' | 'done'>('name');
  const [submitterName, setSubmitterName] = useState('');
  const [images, setImages] = useState<DriveImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const title = label || folderName;

  useEffect(() => {
    if (step !== 'select') return;
    let cancelled = false;
    setError(null);
    fetch(`/api/folders/${folderId}/images`)
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || 'Không tải được ảnh');
        }
        return r.json();
      })
      .then((data) => { if (!cancelled) setImages(data.images || []); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [folderId, step]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleStartSelect = () => {
    if (!submitterName.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }
    setStep('select');
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0 || !images) return;
    setSubmitting(true);
    try {
      const selectedFiles = images
        .filter((img) => selectedIds.has(img.id))
        .map((img) => ({ id: img.id, name: img.name }));

      const res = await fetch(`/api/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedFiles, submitterName: submitterName.trim() }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gửi không thành công');
      }
      setSubmitCount(selectedIds.size);
      setStep('done');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') return <ThankYou name={submitterName} count={submitCount} onAgain={() => {
    setSelectedIds(new Set());
    setStep('name');
    setSubmitterName('');
  }} />;

  if (step === 'name') return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500">
            <User className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Nhập tên của bạn để bắt đầu chọn ảnh</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên của bạn</Label>
            <Input
              id="name"
              placeholder="VD: Chị Lan"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartSelect()}
              autoFocus
            />
          </div>
          <Button className="mt-4 w-full" size="lg" onClick={handleStartSelect}>
            Bắt đầu chọn ảnh
          </Button>
        </div>
      </div>
    </main>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              {submitterName}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Chạm vào ảnh để chọn, nhấn <b>Hoàn thành</b> khi xong.
          </p>
        </div>
      </header>

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

        {!error && images && images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <ImageCard key={img.id} image={img} selected={selectedIds.has(img.id)} onToggle={toggle} />
            ))}
          </div>
        )}
      </main>

      <SubmitBar
        count={selectedIds.size}
        total={images?.length ?? 0}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function ThankYou({ name, count, onAgain }: { name: string; count: number; onAgain: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" strokeWidth={2} />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Cảm ơn, {name}!</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Bạn đã chọn <b>{count}</b> ảnh. Chúng tôi đã nhận được lựa chọn của bạn.
      </p>
      <Button variant="outline" className="mt-8" onClick={onAgain}>
        Chọn lại với tên khác
      </Button>
    </div>
  );
}
