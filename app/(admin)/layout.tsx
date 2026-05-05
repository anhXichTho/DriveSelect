import { AuthGuard } from '@/components/AuthGuard';

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
