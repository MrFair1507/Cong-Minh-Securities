# CMS – Cong Minh Securities

Web mô phỏng đầu tư chứng khoán có giao dịch ký quỹ (margin), làm cho đồ án thực tập tốt nghiệp.

Mỗi người dùng nhận **100.000.000 VND vốn ảo**. Giá cổ phiếu do một script giả lập tạo ra và đẩy realtime tới trình duyệt. Quy tắc ký quỹ dựa trên văn bản công khai (Quyết định 87/QĐ-UBCK).

> "Cong Minh Securities" là tên giả định của một dự án học tập. Đây không phải công ty chứng khoán thật: không có tiền thật, giao dịch thật hay dữ liệu thị trường thật.

## Tính năng chính

- **Tài khoản:** đăng ký, đăng nhập, hồ sơ cá nhân.
- **Bảng giá realtime:** lọc theo sàn, sắp xếp, tìm mã. Khách chưa đăng nhập cũng xem được.
- **Chi tiết mã:** thông tin cổ phiếu và biểu đồ giá.
- **Đặt lệnh thị trường:** mua/bán, có thể vay ký quỹ khi mua, có bước xác nhận trước khi đặt.
- **Lịch sử lệnh:** lọc theo chiều mua/bán và theo mã.
- **Danh mục:** cổ phiếu đang nắm giữ, giá vốn, lãi/lỗ.
- **Dòng tiền:** lịch sử nạp, rút, khớp lệnh.
- **Ký quỹ:** mở tài khoản ký quỹ, theo dõi tỷ lệ, nhận cảnh báo khi giá giảm, trả nợ vay.

Giới hạn phạm vi: chỉ có lệnh thị trường; ký quỹ chỉ cảnh báo, không tự động bán giải chấp; giao diện tiếng Việt, dành cho máy tính.

## Công nghệ

| Phần                   | Công nghệ                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend (`client/`)   | Vite, React 19, TypeScript, TanStack Router / Query / Table / Form, Zod, shadcn/ui, Tailwind CSS v4, Zustand, i18next, lightweight-charts, Vitest |
| Backend (`server/`)    | Supabase: Auth, PostgreSQL, Row Level Security, RPC (PL/pgSQL), Realtime; script Node giả lập giá                                                 |
| Dùng chung (`shared/`) | Công thức ký quỹ dùng cho cả frontend và backend                                                                                                  |
| Công cụ                | Yarn 4 workspaces, Biome (lint + format)                                                                                                          |
| Triển khai             | Vercel (frontend), Supabase Cloud (backend)                                                                                                       |

## Cấu trúc repo

```
.
├── client/          # Ứng dụng web (Vite + React)
│   └── src/
│       ├── routes/      # Định tuyến theo file (TanStack Router)
│       ├── features/    # auth, market, trading, portfolio, margin
│       ├── shared/      # UI, component, API client, tiện ích dùng chung
│       └── i18n/        # Chuỗi giao diện tiếng Việt
├── server/          # Supabase (migration, RLS, RPC) và script giả lập giá
├── shared/          # Gói @cms/shared: công thức ký quỹ
├── biome.json
└── package.json     # Khai báo workspaces và script chung
```

## Yêu cầu cài đặt

- [Node.js](https://nodejs.org/) LTS 24 trở lên
- [Corepack](https://nodejs.org/api/corepack.html) (dùng để chạy đúng phiên bản Yarn 4 mà dự án đã ghim)
- [Git](https://git-scm.com/)
- Một project [Supabase](https://supabase.com/) (gói Free là đủ)

## Chạy lần đầu

```bash
git clone <url-repo>
cd <thu-muc-repo>

corepack enable   # trên Windows có thể cần mở terminal bằng quyền Administrator
yarn install
```

Tạo file biến môi trường (xem mục dưới):

```bash
cp client/.env.example client/.env.local
cp server/.env.example server/.env
# điền giá trị lấy từ Supabase Dashboard vào cả hai file
```

Tạo bảng trong database, sinh kiểu TypeScript, rồi chạy:

```bash
yarn db:push
yarn db:types
yarn dev
```

Lệnh `yarn dev` chạy cùng lúc frontend (Vite) và script giả lập giá. Mở địa chỉ Vite in ra trong terminal (mặc định `http://localhost:5173`).

## Biến môi trường

| File                | Biến                            | Ý nghĩa                                          |
| ------------------- | ------------------------------- | ------------------------------------------------ |
| `client/.env.local` | `VITE_SUPABASE_URL`             | URL project Supabase                             |
| `client/.env.local` | `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (an toàn khi dùng ở trình duyệt) |
| `server/.env`       | `SUPABASE_URL`                  | URL project Supabase                             |
| `server/.env`       | `SUPABASE_SECRET_KEY`           | Secret key, chỉ dùng cho script giả lập          |

Không commit file `.env`. Secret key chỉ đặt trong `server/.env`, không bao giờ đặt trong `client/`.

## Lệnh hay dùng

| Lệnh                                                    | Tác dụng                                                 |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `yarn dev`                                              | Chạy frontend và script giả lập giá                      |
| `yarn workspace client dev`                             | Chỉ chạy frontend                                        |
| `yarn workspace server start`                           | Chỉ chạy script giả lập giá                              |
| `yarn workspace server start --trend=down --session=30` | Chế độ demo: giá giảm liên tục, mỗi 30 giây mở phiên mới |
| `yarn build`                                            | Build frontend để triển khai                             |
| `yarn check`                                            | Kiểm tra lint và format bằng Biome                       |
| `yarn check:fix`                                        | Tự sửa lỗi lint và format                                |
| `yarn db:push`                                          | Đẩy migration lên Supabase                               |
| `yarn db:types`                                         | Sinh kiểu TypeScript từ schema database                  |

## Triển khai

- **Frontend:** Vercel, Root Directory = `client`. File `client/vercel.json` chuyển mọi đường dẫn về `index.html` để định tuyến phía client hoạt động. Khai báo `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY` trong Environment Variables của Vercel.
- **Backend:** Supabase Cloud, region Singapore.

## Tài khoản demo

Đang cập nhật.

## Link demo

Đang cập nhật.
