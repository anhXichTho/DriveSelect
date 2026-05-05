'use client';

import { useState } from 'react';
import { ExternalLink, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Folder } from '@/lib/types';

interface Props {
  folder: Folder;
  sessionCount: number;
  authToken: string | null;
  onDeleted: (id: string) => void;
  onSessionCreated: () => void;
}

export function FolderCard({ folder, sessionCount, authToken, onDeleted, onSessionCreated }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Xóa thư mục "${folder.name}"?\n\nLink chia sẻ đã tạo từ thư mục này sẽ không thể tải ảnh được nữa.`)) return;
    if (!authToken) return toast.error('Phiên đăng nhập đã hết hạn');
    setBusy(true);
    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Xóa không thành công');
      toast.success('Đã xóa thư mục');
      onDeleted(folder.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSession = async () => {
    if (!authToken) return toast.error('Phiên đăng nhập đã hết hạn');
    setBusy(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ folderId: folder.id, label: label.trim() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Tạo link thất bại');
      toast.success('Đã tạo link chia sẻ');
      setLabel('');
      setShowCreate(false);
      onSessionCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{folder.name}</h3>
            <a
              href={folder.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-600"
            >
              <ExternalLink className="h-3 w-3" />
              Mở trên Drive
            </a>
            <div className="mt-2 text-xs text-muted-foreground">
              {sessionCount} link chia sẻ
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={busy}
            aria-label="Xóa thư mục"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {showCreate ? (
          <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <Label htmlFor={`label-${folder.id}`} className="text-xs">
                Nhãn cho link (tùy chọn)
              </Label>
              <Input
                id={`label-${folder.id}`}
                placeholder="VD: Gửi cho chị Lan"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={busy}
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateSession} disabled={busy}>
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Tạo link'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)} disabled={busy}>
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreate(true)}
            disabled={busy}
            className="mt-4 w-full"
          >
            <Plus className="h-4 w-4" />
            Tạo link chia sẻ
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
