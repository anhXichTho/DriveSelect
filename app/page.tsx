import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mb-6">
          <span className="text-white text-3xl font-bold">D</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">DriveSelect</h1>
        <p className="text-muted-foreground mb-8">
          Công cụ chia sẻ thư mục Google Drive và để khách chọn ảnh nhanh chóng.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 font-medium transition-colors"
        >
          Vào trang Admin
        </Link>
      </div>
    </main>
  );
}
