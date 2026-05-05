# DriveSelect

App nhỏ để gửi link cho khách chọn ảnh từ một thư mục Google Drive — bạn nhận lại danh sách ảnh đã chọn qua email và xem được trên dashboard.

## Tính năng

**Admin (chỉ bạn dùng):**
- Đăng nhập email/password (Firebase Auth)
- Thêm/xóa thư mục — mỗi thư mục là 1 link Drive đã share public
- Tạo "link chia sẻ" để gửi cho khách
- Xem lịch sử lựa chọn của từng người
- Nhận email thông báo khi có người hoàn thành

**Khách (không cần đăng nhập):**
- Mở link `app.com/select/[sessionId]`
- Tap để chọn nhiều ảnh
- Nhấn **Hoàn thành** → submit → màn hình cảm ơn
- Đã submit rồi thì không chọn lại được

## Stack

Next.js 14 (App Router) · TypeScript · TailwindCSS · shadcn/ui · Firebase Auth + Firestore · Google Drive API v3 (Service Account) · Resend (email) · deploy trên Vercel.

## Cài đặt local

### 1. Clone & install

```bash
cd driveselect
npm install
```

### 2. Tạo Firebase project

1. Vào [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Sau khi tạo xong:
   - Vào **Build → Authentication** → bật **Email/Password**
   - Vào **Build → Firestore Database** → **Create database** → Production mode → chọn region gần (asia-southeast1 cho VN)
3. Lấy **Firebase Client config**:
   - Project settings → General → Your apps → click icon Web
   - Copy 6 giá trị `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`
4. Lấy **Firebase Admin credentials**:
   - Project settings → Service accounts → **Generate new private key** → tải file JSON về
   - Mở file JSON đó, copy toàn bộ nội dung (sẽ paste vào env ở bước 5)

### 3. Tạo Google Cloud project + bật Drive API

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services → Library** → tìm **Google Drive API** → **Enable**
3. **APIs & Services → Credentials** → **Create credentials → Service account** → tạo và tải JSON key về

> 💡 **Tip:** Nếu bạn dùng cùng GCP project với Firebase, bạn có thể dùng luôn service account của Firebase Admin (file JSON ở bước 2.4) — chỉ cần Enable Drive API trong cùng project là được. Khi đó dùng cùng 1 JSON cho cả 2 env vars.

4. **Quan trọng:** Mỗi thư mục Drive bạn muốn dùng phải được share một trong 2 cách:
   - **Anyone with the link → Viewer** (đơn giản nhất), hoặc
   - Share trực tiếp với email của Service Account (dạng `xxx@xxx.iam.gserviceaccount.com`) với quyền Viewer

### 4. Tạo Resend account

1. Đăng ký tại [resend.com](https://resend.com)
2. **API Keys** → tạo key mới → copy
3. Mặc định bạn có thể dùng `from` là `onboarding@resend.dev` để gửi đến chính email đăng ký. Để gửi đến email khác, cần verify domain trong Resend.

### 5. Tạo `.env.local`

```bash
cp .env.local.example .env.local
```

Mở file `.env.local` và điền:

```env
# 6 giá trị từ Firebase Client config (bước 2.3)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123...
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# Toàn bộ nội dung file JSON ở bước 2.4 — dán thành 1 dòng
FIREBASE_ADMIN_CREDENTIALS={"type":"service_account","project_id":"...",...}

# Có thể dùng cùng JSON với FIREBASE_ADMIN_CREDENTIALS (xem tip bước 3)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=DriveSelect <onboarding@resend.dev>
ADMIN_EMAIL=ban@email.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Lưu ý dán JSON:** JSON service account chứa nhiều dấu xuống dòng trong field `private_key` (dạng `\n`). Cứ paste nguyên xi cả file thành 1 dòng — code đã tự handle escape `\n`.

### 6. Tạo tài khoản Admin đầu tiên

DriveSelect không có UI signup. Bạn tự thêm user trong Firebase Console:

1. Firebase Console → **Authentication → Users** → **Add user**
2. Nhập email + password → **Add user**

### 7. Chạy dev

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) → bấm **Vào trang Admin** → đăng nhập bằng tài khoản vừa tạo.

## Workflow sử dụng

1. **Admin → Thêm thư mục** với link Drive folder
2. **Tạo link chia sẻ** từ card thư mục, gắn nhãn (ví dụ "Gửi cho chị Lan")
3. **Copy link** và gửi cho khách qua tin nhắn / email
4. Khách mở link, chọn ảnh, nhấn **Hoàn thành**
5. Bạn nhận **email** thông báo và xem chi tiết trong **Admin → Link chia sẻ → Chi tiết**

## Deploy lên Vercel

1. Push code lên GitHub
2. [vercel.com/new](https://vercel.com/new) → import repo → framework auto-detect Next.js
3. Trong **Environment Variables**, dán hết các biến trong `.env.local` của bạn (đặt cho cả 3 môi trường: Production / Preview / Development)
4. **Deploy**
5. Sau khi deploy: cập nhật env `NEXT_PUBLIC_APP_URL` thành domain Vercel (vd `https://driveselect.vercel.app`) và **Redeploy** để link share dùng đúng URL

### Lưu ý Firebase Auth domain

Sau khi deploy, vào Firebase Console → **Authentication → Settings → Authorized domains** → thêm domain Vercel (`driveselect.vercel.app`) để login không bị chặn.

## Cấu trúc

```
app/
  (admin)/                  ← route group: layout có AuthGuard
    layout.tsx
    login/page.tsx          → /login
    admin/
      page.tsx              → /admin (dashboard)
      folders/new/page.tsx  → /admin/folders/new
      sessions/[sessionId]/page.tsx
  select/[sessionId]/
    page.tsx                ← server component, fetch session từ Firestore
    not-found.tsx
  api/
    folders/                ← admin-only (Bearer token)
    sessions/               ← submit không cần auth (public link)
components/
  ui/                       ← shadcn primitives
  ImageGrid, ImageCard, SubmitBar, FolderCard, SessionCard, AdminNav, AuthGuard, CopyButton
lib/
  types.ts
  firebase.ts               ← client SDK (lazy proxy)
  firebase-admin.ts         ← admin SDK (lazy proxy)
  drive.ts                  ← server-only: getFolderImages
  drive-shared.ts           ← client-safe: extractFolderId
  email.ts                  ← Resend
  auth-server.ts            ← verify Bearer ID token
  firestore-mappers.ts      ← Firestore ↔ TS types
  utils.ts                  ← cn(), formatDateTime, copyToClipboard
```

## Bảo mật

- API routes của Admin (`POST /api/folders`, `DELETE /api/folders/:id`, `POST /api/sessions`, `GET /api/folders`, `GET /api/sessions`) verify Firebase ID token qua header `Authorization: Bearer <token>`
- API public (`GET /api/folders/:id/images`, `GET /api/sessions/:id`, `POST /api/sessions/:id/submit`) không cần auth nhưng `submit` dùng Firestore transaction để chống double-submit
- Service account JSON chỉ tồn tại trong env server, không expose ra client
- Drive API kết quả được cache 5 phút (`unstable_cache` + `revalidate: 300`) để giảm quota

## Giới hạn đã biết

- 1 session chỉ chọn được tối đa **500 ảnh** (chống abuse)
- 1 folder Drive chỉ list tối đa **200 ảnh** (Drive API pageSize)
- Drive thumbnail link tự upscale lên `=s400` cho chất lượng tốt hơn
- Email Resend free tier: 100 email/ngày — quá đủ cho use case này

## Scripts

```bash
npm run dev        # dev server localhost:3000
npm run build      # production build
npm run start      # chạy production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```
