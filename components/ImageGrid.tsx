'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ImageIcon, User, Download, Filter } from 'lucide-react';
import type { DriveImage, SelectedFile } from '@/lib/types';
import { ImageCard } from './ImageCard';
import { ImageLightbox } from './ImageLightbox';
import { SubmitBar } from './SubmitBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 100;

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
  const [submittedFiles, setSubmittedFiles] = useState<SelectedFile[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const title = label || folderName;
  const displayImages = images
    ? (showOnlySelected ? images.filter((img) => selectedIds.has(img.id)) : images)
    : [];
  const totalPages = Math.ceil(displayImages.length / PAGE_SIZE);
  const pagedImages = displayImages.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFilter = () => {
    setShowOnlySelected((v) => !v);
    setCurrentPage(0);
  };

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

  const handleStartSelect = async () => {
    if (!submitterName.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }
    setLookingUp(true);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/submissions/lookup?name=${encodeURIComponent(submitterName.trim())}`,
      );
      const data = await res.json();
      if (Array.isArray(data.selectedFiles) && data.selectedFiles.length > 0) {
        setSelectedIds(new Set<string>(data.selectedFiles.map((f: SelectedFile) => f.id)));
        setIsReturning(true);
        toast.success(`Đã khôi phục ${data.selectedFiles.length} ảnh bạn đã chọn trước đó`);
      } else {
        setIsReturning(false);
      }
    } catch {
      // bỏ qua lỗi, vẫn cho vào chọn
    } finally {
      setLookingUp(false);
      setStep('select');
    }
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
      const data = await res.json();
      const files = images
        .filter((img) => selectedIds.has(img.id))
        .map((img) => ({ id: img.id, name: img.name }));
      setSubmittedFiles(files);
      setSubmissionId(data.submission?.id ?? null);
      setStep('done');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') return <ThankYou
    name={submitterName}
    files={submittedFiles}
    sessionId={sessionId}
    submissionId={submissionId}
    onAgain={() => {
      setSelectedIds(new Set());
      setSubmittedFiles([]);
      setStep('name');
      setSubmitterName('');
      setIsReturning(false);
      setSubmissionId(null);
    }}
  />;

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
          <Button className="mt-4 w-full" size="lg" onClick={handleStartSelect} disabled={lookingUp}>
            {lookingUp ? 'Đang kiểm tra…' : 'Bắt đầu chọn ảnh'}
          </Button>
        </div>
      </div>
    </main>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              {submitterName}
            </span>
            {isReturning && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Đang chỉnh sửa
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Chạm vào ảnh để chọn, nhấn <b>Hoàn thành</b> khi xong.
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
            {/* Vertical pagination sidebar */}
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

            {/* Image grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pagedImages.map((img, localIdx) => {
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

      <SubmitBar
        count={selectedIds.size}
        total={images?.length ?? 0}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

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

function ThankYou({
  name, files, sessionId, submissionId, onAgain,
}: {
  name: string;
  files: SelectedFile[];
  sessionId: string;
  submissionId: string | null;
  onAgain: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const downloadAll = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/download/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, zipName: `anh-da-chon-${name.replace(/\s+/g, '-')}` }),
      });
      if (!res.ok) throw new Error('Tạo ZIP thất bại');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `anh-da-chon-${name}.zip`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Tải thất bại');
    } finally {
      setDownloading(false);
    }
  };

  const saveNotes = async () => {
    if (!submissionId || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const selectedFiles: SelectedFile[] = files.map((f) => ({
        ...f,
        ...(notes[f.id]?.trim() ? { note: notes[f.id].trim() } : { note: undefined }),
      }));
      const res = await fetch(`/api/sessions/${sessionId}/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedFiles }),
      });
      if (!res.ok) throw new Error('Lưu thất bại');
      setSaved(true);
      toast.success('Đã lưu yêu cầu chỉnh sửa');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const hasNotes = Object.values(notes).some((n) => n.trim());

  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-lg pt-10">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={2} />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Cảm ơn, {name}!</h1>
          <p className="mt-1 text-muted-foreground">
            Đã nhận <b>{files.length}</b> ảnh bạn chọn.
          </p>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Ảnh đã chọn ({files.length})
          </h2>
          <Button size="sm" onClick={downloadAll} disabled={downloading} className="shrink-0">
            <Download className="h-4 w-4" />
            {downloading ? 'Đang tải…' : 'Tải tất cả'}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-white divide-y divide-border overflow-hidden">
          {files.map((f, i) => (
            <div key={f.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-xs text-muted-foreground text-right">{i + 1}</span>
                <span className="flex-1 truncate text-sm font-medium">{f.name}</span>
                <a
                  href={`/api/download/${f.id}?name=${encodeURIComponent(f.name)}`}
                  download={f.name}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-brand-600 transition-colors"
                  title="Tải về"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-2 pl-9">
                <textarea
                  rows={2}
                  value={notes[f.id] ?? ''}
                  onChange={(e) => { setNotes((prev) => ({ ...prev, [f.id]: e.target.value })); setSaved(false); }}
                  placeholder="Yêu cầu chỉnh sửa cho ảnh này… (tùy chọn)"
                  className="w-full resize-none rounded-md border border-border bg-muted/40 px-3 py-2 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>
            </div>
          ))}
        </div>

        {submissionId && (
          <div className="mt-3 flex items-center justify-end gap-3">
            {saved && <span className="text-xs text-emerald-600">Đã lưu</span>}
            <Button
              size="sm"
              variant={hasNotes ? 'default' : 'outline'}
              onClick={saveNotes}
              disabled={saving}
            >
              {saving ? 'Đang lưu…' : 'Lưu yêu cầu chỉnh sửa'}
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onAgain}>Chọn lại với tên khác</Button>
        </div>
      </div>
    </div>
  );
}
