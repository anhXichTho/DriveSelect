'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthGuard';
import { AdminNav } from '@/components/AdminNav';
import { FolderCard } from '@/components/FolderCard';
import { SessionCard } from '@/components/SessionCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Folder, Session } from '@/lib/types';

interface FolderApi extends Omit<Folder, 'createdAt'> {
  createdAt: string;
}
interface SessionApi extends Omit<Session, 'createdAt' | 'completedAt'> {
  createdAt: string;
  completedAt: string | null;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const reload = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [fRes, sRes] = await Promise.all([
        fetch('/api/folders', { headers }),
        fetch('/api/sessions', { headers }),
      ]);
      if (!fRes.ok) throw new Error('Không tải được folders');
      if (!sRes.ok) throw new Error('Không tải được sessions');

      const fData: { folders: FolderApi[] } = await fRes.json();
      const sData: { sessions: SessionApi[] } = await sRes.json();

      setFolders(
        fData.folders.map((f) => ({ ...f, createdAt: new Date(f.createdAt) })),
      );
      setSessions(
        sData.sessions.map((s) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          completedAt: s.completedAt ? new Date(s.completedAt) : null,
        })),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi tải dữ liệu');
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleFolderDeleted = (id: string) => {
    setFolders((prev) => (prev ? prev.filter((f) => f.id !== id) : prev));
  };

  const sessionCountByFolder = (folderId: string) =>
    sessions?.filter((s) => s.folderId === folderId).length ?? 0;

  const loading = folders === null || sessions === null;

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">Thư mục của tôi</h2>
              <p className="text-sm text-muted-foreground">
                Mỗi thư mục gắn với 1 folder Google Drive đã share công khai.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/admin/folders/new">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Thêm thư mục</span>
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : folders && folders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">Chưa có thư mục nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Thêm thư mục Drive đầu tiên để bắt đầu tạo link chia sẻ.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/admin/folders/new">
                  <Plus className="h-4 w-4" />
                  Thêm thư mục
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {folders!.map((f) => (
                <FolderCard
                  key={f.id}
                  folder={f}
                  sessionCount={sessionCountByFolder(f.id)}
                  authToken={token}
                  onDeleted={handleFolderDeleted}
                  onSessionCreated={reload}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold sm:text-xl">Link chia sẻ</h2>
            <p className="text-sm text-muted-foreground">
              Danh sách các link đã tạo. Mới nhất hiển thị trên cùng.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : sessions && sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="font-medium">Chưa có link nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bấm “Tạo link chia sẻ” trong card thư mục ở trên.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions!.map((s) => (
                <SessionCard key={s.id} session={s} appUrl={appUrl} />
              ))}
            </div>
          )}
        </section>

        {!loading && folders === null && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
    </div>
  );
}
