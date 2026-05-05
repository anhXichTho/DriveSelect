'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { LogOut, Users } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuth } from './AuthGuard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        'text-sm font-medium transition-colors',
        pathname === href
          ? 'text-brand-600'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
              D
            </div>
            <span className="font-semibold">DriveSelect</span>
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            {navLink('/admin', 'Dashboard')}
            {navLink('/admin/users', 'Người dùng')}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile nav */}
          <Link href="/admin/users" className="sm:hidden p-2 text-muted-foreground hover:text-foreground">
            <Users className="h-4 w-4" />
          </Link>
          {user?.email && (
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)} aria-label="Đăng xuất">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
