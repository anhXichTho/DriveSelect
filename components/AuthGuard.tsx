'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? '';

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  isOwner: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, token: null, loading: true, isOwner: false });

export function useAuth() {
  return useContext(Ctx);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const t = await u.getIdToken();
          setToken(t);
        } catch {
          setToken(null);
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/login') {
      router.replace('/login');
    } else if (user && pathname === '/login') {
      router.replace('/admin');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user && pathname !== '/login') return null;

  const isOwner = !!OWNER_EMAIL && user?.email === OWNER_EMAIL;

  return <Ctx.Provider value={{ user, token, loading, isOwner }}>{children}</Ctx.Provider>;
}
