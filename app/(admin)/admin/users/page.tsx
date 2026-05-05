'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, ShieldOff, ShieldCheck, Loader2, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthGuard';
import { AdminNav } from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  disabled: boolean;
  createdAt: string;
  lastSignIn: string | null;
}

export default function UsersPage() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Không tải được danh sách');
      const data = await res.json();
      setUsers(data.users);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim(), password, displayName: displayName.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(`Đã tạo user ${j.user.email}`);
      setEmail(''); setPassword(''); setDisplayName(''); setShowForm(false);
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Lỗi'); }
    finally { setBusy(false); }
  };

  const handleToggle = async (uid: string, disabled: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/users/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disabled: !disabled }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(disabled ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Lỗi'); }
  };

  const handleDelete = async (uid: string, email: string) => {
    if (!confirm(`Xóa tài khoản "${email}"?\nHành động này không thể hoàn tác.`)) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/users/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Đã xóa tài khoản');
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Lỗi'); }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Quản lý người dùng</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tài khoản admin có thể đăng nhập vào trang quản trị.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Thêm user
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Tạo tài khoản mới</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tên hiển thị</Label>
                  <Input placeholder="Nguyễn A" value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)} disabled={busy} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email <span className="text-destructive">*</span></Label>
                  <Input type="email" placeholder="user@email.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} disabled={busy} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mật khẩu <span className="text-destructive">*</span></Label>
                  <Input type="password" placeholder="tối thiểu 6 ký tự" value={password}
                    onChange={(e) => setPassword(e.target.value)} disabled={busy} className="h-9 text-sm" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={busy || !email || !password}>
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Tạo'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)} disabled={busy}>Hủy</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {users === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <UserCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Chưa có user nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <Card key={u.uid}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold">
                    {(u.displayName || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {u.displayName || u.email}
                      </span>
                      {u.disabled && <Badge variant="outline" className="text-xs text-destructive border-destructive/40">Bị khóa</Badge>}
                      {me?.uid === u.uid && <Badge variant="default" className="text-xs">Bạn</Badge>}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{u.email}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Tạo {formatDateTime(new Date(u.createdAt))}
                      {u.lastSignIn && ` · Đăng nhập lần cuối ${formatDateTime(new Date(u.lastSignIn))}`}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {me?.uid !== u.uid && (
                      <>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleToggle(u.uid, u.disabled)}
                          title={u.disabled ? 'Mở khóa' : 'Khóa tài khoản'}
                          className="text-muted-foreground hover:text-amber-600"
                        >
                          {u.disabled
                            ? <ShieldCheck className="h-4 w-4" />
                            : <ShieldOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleDelete(u.uid, u.email)}
                          title="Xóa tài khoản"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
