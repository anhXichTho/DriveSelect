'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { X, Copy, Check, ImageIcon, ExternalLink, FolderOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/AuthGuard';
import { AdminNav } from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Folder, ProfileImage } from '@/lib/types';

interface FolderApi extends Omit<Folder, 'createdAt'> { createdAt: string; }

export default function AdminProfilePage() {
  const { token, user } = useAuth();
  const [profileImages, setProfileImages] = useState<ProfileImage[]>([]);
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => { setAppUrl(window.location.origin); }, []);

  const shareUrl = user && appUrl ? `${appUrl}/p/${user.uid}` : '';

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProfileImages(data.profile?.images ?? []);
      }
    } catch { /* ignore */ }
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [pRes, fRes] = await Promise.all([
        fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/folders', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProfileImages(pData.profile?.images ?? []);
      }
      if (fRes.ok) {
        const fData: { folders: FolderApi[] } = await fRes.json();
        setFolders(fData.folders.map((f) => ({ ...f, createdAt: new Date(f.createdAt) })));
      }
    } catch {
      toast.error('Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Reload profile khi quay lại tab
  useEffect(() => {
    const handler = () => { if (!document.hidden) loadProfile(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [loadProfile]);

  const removeFromProfile = async (fileId: string) => {
    if (!token) return;
    const updated = profileImages.filter((img) => img.fileId !== fileId);
    setProfileImages(updated);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updated }),
      });
      if (!res.ok) throw new Error('Lưu thất bại');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại');
      loadProfile();
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openBrowse = (folder: Folder) => {
    window.open(
      `/admin/profile/${folder.id}?name=${encodeURIComponent(folder.name)}`,
      '_blank',
    );
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">Portfolio của tôi</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Chọn ảnh mẫu để gửi khách hàng tham khảo phong cách
            </p>
          </div>
          {shareUrl && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Xem trang
              </a>
              <Button size="sm" variant="outline" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Đã sao chép' : 'Sao chép link'}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Current portfolio */}
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Ảnh đang hiển thị ({profileImages.length})
              </h2>
              {profileImages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-10 text-center">
                  <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 font-medium">Chưa có ảnh nào</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mở một thư mục bên dưới để chọn ảnh thêm vào portfolio
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {profileImages.map((img) => (
                    <div key={img.fileId} className="relative group">
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={img.thumbnailLink}
                          alt={img.fileName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => removeFromProfile(img.fileId)}
                          className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          title="Xóa khỏi portfolio"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground px-0.5">{img.fileName}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Folder list */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Thêm ảnh từ thư mục
              </h2>
              {!folders || folders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có thư mục nào.</p>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => {
                    const addedCount = profileImages.filter((p) => p.folderId === folder.id).length;
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => openBrowse(folder)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-white hover:bg-muted/30 hover:border-brand-200 transition-colors text-left group"
                      >
                        <FolderOpen className="h-5 w-5 text-brand-500 shrink-0" />
                        <span className="flex-1 font-medium text-sm">{folder.name}</span>
                        {addedCount > 0 && (
                          <span className="text-xs rounded-full bg-brand-100 text-brand-700 px-2.5 py-0.5 font-medium">
                            {addedCount} ảnh đã chọn
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
