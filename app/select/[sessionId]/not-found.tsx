import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
        <AlertCircle className="h-12 w-12 text-amber-600" strokeWidth={2} />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Link không hợp lệ</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Link này không tồn tại hoặc đã bị xóa. Hãy hỏi lại người gửi link.
      </p>
    </main>
  );
}
