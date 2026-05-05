'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, FolderOpen, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthGuard';
import { AdminNav } from '@/components/AdminNav';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CopyButton } from '@/components/CopyButton';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import type { Folder, Session, Submission } from '@/lib/types';

type SessionApi = Omit<Session, 'createdAt' | 'completedAt'> & { createdAt: string; completedAt: string | null };
type FolderApi = Omit<Folder, 'createdAt'> & { createdAt: string };
type SubmissionApi = Omit<Submission, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string | null };

async function downloadZip(files: Submission['selectedFiles'], submitterName: string) {
  const res = await fetch('/api/download/zip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files,
      zipName: `anh-${submitterName.replace(/\s+/g, '-')}`,
    }),
  });
  if (!res.ok) throw new Error('Tạo ZIP thất bại');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anh-${submitterName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SessionDetailPage({ params }: { params: { sessionId: string } }) {
  const { token } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => { setAppUrl(window.location.origin); }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/sessions/${params.sessionId}`).then((r) => r.json()),
      token
        ? fetch(`/api/sessions/${params.sessionId}/submissions`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json())
        : Promise.resolve({ submissions: [] }),
    ])
      .then(([sessionData, subData]) => {
        if (cancelled) return;
        if (sessionData.error) throw new Error(sessionData.error);
        const s: SessionApi = sessionData.session;
        setSession({ ...s, createdAt: new Date(s.createdAt), completedAt: s.completedAt ? new Date(s.completedAt) : null });
        if (sessionData.folder) {
          const f: FolderApi = sessionData.folder;
          setFolder({ ...f, createdAt: new Date(f.createdAt) });
        }
        const subs: SubmissionApi[] = subData.submissions ?? [];
        setSubmissions(subs.map((sub) => ({ ...sub, createdAt: new Date(sub.createdAt), updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : null })));
      })
      .catch((e) => { if (!cancelled) { setError(e.message); toast.error(e.message); } });
    return () => { cancelled = true; };
  }, [params.sessionId, token]);

  const shareUrl = appUrl ? `${appUrl}/select/${params.sessionId}` : '';

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>

        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
        {!error && !session && <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}

        {session && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <Badge variant={submissions && submissions.length > 0 ? 'completed' : 'pending'}>
                {submissions && submissions.length > 0 ? `${submissions.length} lần chọn` : 'Chưa có ai chọn'}
              </Badge>
              <h1 className="text-xl font-bold sm:text-2xl">{session.label || '(không có nhãn)'}</h1>
            </div>

            <Card className="mb-6">
              <CardContent className="p-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Thư mục</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      {session.folderName}
                      {folder?.driveUrl && (
                        <a href={folder.driveUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Tạo lúc</dt>
                    <dd className="mt-1 text-sm">{formatDateTime(session.createdAt)}</dd>
                  </div>
                </dl>
                <div className="mt-5 border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground">Link chia sẻ</div>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <code className="flex-1 truncate text-xs">{shareUrl || '...'}</code>
                    {shareUrl && <CopyButton value={shareUrl} label="Copy" size="sm" variant="outline" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="mb-3 text-lg font-semibold">
              Lượt chọn ({submissions?.length ?? 0})
            </h2>

            {submissions === null ? (
              <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
            ) : submissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Chưa có ai submit lựa chọn qua link này.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <Card key={sub.id}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold">
                            {sub.submitterName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-semibold text-sm">{sub.submitterName}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateTime(sub.createdAt)} · {sub.selectedFiles.length} ảnh
                              {sub.updatedAt && <span className="ml-1 text-amber-600">· Sửa {formatDateTime(sub.updatedAt)}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={downloading === sub.id}
                          onClick={async () => {
                            setDownloading(sub.id);
                            try { await downloadZip(sub.selectedFiles, sub.submitterName); }
                            catch (e) { toast.error(e instanceof Error ? e.message : 'Tải thất bại'); }
                            finally { setDownloading(null); }
                          }}
                          className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {downloading === sub.id ? 'Đang tải…' : 'Tải ZIP'}
                        </button>
                      </div>
                      <ul className="divide-y divide-border rounded-lg border border-border">
                        {sub.selectedFiles.map((f, i) => (
                          <li key={f.id} className="px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-muted-foreground shrink-0">{i + 1}.</span>
                                <span className="truncate text-sm">{f.name}</span>
                              </div>
                              <a
                                href={`https://drive.google.com/file/d/${f.id}/view`}
                                target="_blank" rel="noopener noreferrer"
                                className="shrink-0 text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                              >
                                Drive <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            {f.note && (
                              <p className="mt-1 ml-5 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-900">
                                💬 {f.note}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
