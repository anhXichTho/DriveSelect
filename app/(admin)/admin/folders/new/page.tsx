'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthGuard';
import { AdminNav } from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { extractFolderId } from '@/lib/drive-shared';

export default function NewFolderPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const onUrlChange = (v: string) => {
    setDriveUrl(v);
    if (!v.trim()) {
      setUrlError(null);
      return;
    }
    const id = extractFolderId(v);
    setUrlError(id ? null : 'URL không hợp lệ. Hãy paste link folder Google Drive đầy đủ.');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error('Phiên đăng nhập đã hết hạn');
    if (urlError) return;

    setBusy(true);
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), driveUrl: driveUrl.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Tạo thất bại');
      }
      toast.success('Đã thêm thư mục');
      router.replace('/admin');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>

        <h1 className="mb-1 text-2xl font-bold">Thêm thư mục mới</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Đảm bảo thư mục Drive đã được share <b>“Anyone with the link → Viewer”</b> hoặc đã chia sẻ
          với email service account.
        </p>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Tên thư mục</Label>
                <Input
                  id="name"
                  required
                  placeholder="VD: Album cưới Nam & Lan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground">
                  Tên này hiển thị trong dashboard, không phải cho khách.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="url">URL Google Drive</Label>
                <Input
                  id="url"
                  required
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveUrl}
                  onChange={(e) => onUrlChange(e.target.value)}
                  disabled={busy}
                  aria-invalid={!!urlError}
                />
                {urlError && <p className="text-xs text-destructive">{urlError}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={busy || !!urlError} size="lg">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Thêm thư mục'}
                </Button>
                <Button type="button" variant="outline" size="lg" asChild disabled={busy}>
                  <Link href="/admin">Hủy</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
