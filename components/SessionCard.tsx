'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from './CopyButton';
import { formatDateTime } from '@/lib/utils';
import type { Session } from '@/lib/types';

interface Props {
  session: Session;
  appUrl: string;
}

export function SessionCard({ session, appUrl }: Props) {
  const shareUrl = `${appUrl.replace(/\/$/, '')}/select/${session.id}`;
  const isCompleted = session.status === 'completed';

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={isCompleted ? 'completed' : 'pending'}>
                {isCompleted ? 'Đã chọn xong' : 'Chờ chọn'}
              </Badge>
              {isCompleted && (
                <span className="text-xs text-muted-foreground">
                  {session.selectedFiles.length} ảnh
                </span>
              )}
            </div>
            <h3 className="mt-2 truncate text-sm font-semibold sm:text-base">
              {session.label || '(không có nhãn)'}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Thư mục: {session.folderName}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Tạo {formatDateTime(session.createdAt)}
              {session.completedAt && ` · Hoàn thành ${formatDateTime(session.completedAt)}`}
            </p>
          </div>
          <Link
            href={`/admin/sessions/${session.id}`}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Chi tiết
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <code className="flex-1 truncate text-xs text-muted-foreground">{shareUrl}</code>
          <CopyButton value={shareUrl} label="" size="sm" variant="ghost" />
        </div>
      </CardContent>
    </Card>
  );
}
