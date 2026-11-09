# CLAUDE.md

Đồ án thực tập tốt nghiệp, Minh làm một mình, hạn khoảng 02/12/2026. Trả lời tiếng Việt, ngắn gọn, đi thẳng vào việc.

## Bối cảnh

- CMS (Cong Minh Securities): web mô phỏng đầu tư chứng khoán có ký quỹ. Vốn ảo 100 triệu VND, giá do script Node giả lập. Kiến thức ký quỹ chỉ lấy từ nguồn công khai (QĐ 87/QĐ-UBCK).
- Phạm vi: 7 nhóm chức năng, 9 trang, 5 hộp thoại. Chỉ lệnh thị trường. Ký quỹ chỉ cảnh báo, không tự bán giải chấp. Chỉ tiếng Việt (vẫn giữ key i18n), chỉ desktop.
- 9 trang: `/login`, `/register`, `/market?exchange=&sort=&q=` (khách xem được), `/stocks/$symbol`, `/orders?side=&symbol=`, `/portfolio`, `/cash?type=`, `/margin`, `/profile`.
- 5 hộp thoại: Đặt lệnh (có nhánh vay), Xác nhận lệnh, Mở tài khoản ký quỹ, Trả nợ ký quỹ, Cảnh báo ký quỹ (toast/popup).
- Luồng demo: đăng nhập → xem giá → đặt lệnh có vay ký quỹ → xem danh mục → giá giảm → nhận cảnh báo → trả nợ.
- Lịch:
  - Tuần 1 (09–15/11): khởi tạo, Supabase, auth, giả lập giá + Realtime, bảng giá, chi tiết mã, RLS.
  - Tuần 2 (16–22/11): đặt lệnh, `place_order`, lịch sử lệnh, danh mục, dòng tiền, ký quỹ.
  - Tuần 3 (23–29/11): unit test, sửa lỗi, demo, báo cáo.

## Stack (đã chốt, không đổi)

- Monorepo Yarn 4 workspaces (`nodeLinker: node-modules`): `client/`, `server/`, `shared/`. Biome thay ESLint + Prettier (nháy đơn, không chấm phẩy).
- client: Vite + React 19 + TypeScript 7; TanStack Router (file-based), Query, Table, Form + Zod; shadcn/ui + Tailwind v4; Zustand; i18next; lightweight-charts; Vitest. Alias `@/` → `client/src`.
- server: Supabase (Auth, PostgreSQL, RLS, RPC PL/pgSQL `security definer`, Realtime cho `stocks` và `margin_calls`) + script Node giả lập giá (`server/simulator`, chạy bằng tsx, dùng secret key). Không có API server tự viết: tên `server/` chỉ là nơi chứa schema Supabase và script giả lập.
- shared: gói `@cms/shared`, file `margin.ts` (công thức ký quỹ dùng chung cho client và server), để nguyên `.ts`, không build. Import: `@cms/shared/margin`.
- ERD 10 bảng: `profiles` (nối `auth.users`), `exchanges`, `stocks` (có `price`), `price_history`, `orders`, `holdings`, `cash_transactions`, `margin_accounts`, `margin_loans`, `margin_calls`.
- Deploy: client lên Vercel (Root Directory = `client`, có `vercel.json` rewrite về `index.html`); Supabase Cloud gói Free, region Singapore.
- Không dùng: Next.js, NestJS, mock toàn bộ, TanStack DB, AG Grid.

## Trạng thái repo (09/11)

- Xong Bước 1–3: Yarn 4.18.1 (đã ghim `packageManager`), Biome (`rules.preset "recommended"`), client chạy được `/market` hiện "Bảng giá", `shared/src/margin.ts` khung ban đầu.
- Đã đổi tên: workspace `fe` → `client`, `investsim` → `cms`, `@investsim/shared` → `@cms/shared`.
- Template Vite mới dùng oxlint: đã gỡ. TypeScript 7 không có `baseUrl`: alias chỉ khai báo bằng `paths`.
- Xong shadcn/ui (bước 2.4): base radix, preset nova, font Geist (có subset tiếng Việt). Component nằm ở `client/src/shared/ui/`. shadcn 4.x dùng gói `cn` (thay clsx + tailwind-merge), component import thẳng `from "cn"`. Thêm component: `cd client` rồi `corepack yarn dlx shadcn@latest add <tên>`.
- `biome.json` bật `css.parser.tailwindDirectives` để Biome đọc được `@apply`, `@theme`.
- Git: nhánh `main`, remote `origin` = GitHub `MrFair1507/Cong-Minh-Securities`. Claude không push được (không nhập được thông tin đăng nhập): Minh tự `git push`. `.gitattributes` giữ LF cho Biome. `doc/` bị ignore.
- Đã đổi tên workspace `be` → `server` (tài liệu trong `doc/` vẫn ghi `be`).
- Đã tạo khung `server/` (package.json, tsconfig.json, .env.example). Project Supabase "CMS" ở `ap-southeast-1` (Singapore); CLI đã login, `init` (`server/supabase/config.toml`, project_id "cms") và `link`. Chạy lệnh CLI trong `server/`: `corepack yarn supabase <lệnh>`. `.claude/settings.json` chặn Claude đọc/sửa file `.env`.
- Xong migration `init_schema` (10 bảng, ràng buộc, trigger tạo profile 100 triệu, RLS chỉ đọc, Realtime `stocks` + `margin_calls`) và `seed.sql` (2 sàn, 30 mã, 60 phiên nến), đã push lên cloud; `database.types.ts` đã sinh thật. Ghi dữ liệu nghiệp vụ chỉ qua RPC (tuần 2). Ngưỡng ký quỹ lưu ở `margin_accounts` (0.5 / 0.4 / 0.3), `shared/margin.ts` nhận ngưỡng qua tham số.
- Supabase CLI 3.0 mặc định nhắm DB cục bộ: lệnh tới cloud phải có `--remote` (script `db:push`, `db:types` đã thêm). Máy không có Docker. Migration mới: `corepack yarn supabase migration new <tên>` trong `server/`, không sửa migration đã push.
- CHƯA làm: simulator (Bước 5). Vì chưa có `server/simulator/index.ts` nên `yarn dev` ở gốc chưa chạy; tạm dùng `yarn workspace client dev`.
- Trên máy này, `yarn` trong PowerShell đang trỏ tới Yarn 1.22 cài global qua npm. Dùng `corepack yarn ...`, hoặc chạy `corepack enable` (cần quyền admin) rồi gỡ Yarn 1 global.
- Script gốc: `dev` (concurrently client + server), `build`, `check`, `check:fix`, `db:push`, `db:types`.
- Biến môi trường:
  - `client/.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - `server/.env`: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.
  - Secret key chỉ nằm trong `server/.env`, không bao giờ đặt trong `client/`.

## Cấu trúc thư mục client/src (dự kiến)

- `routes/`: file mỏng (`validateSearch`, `loader`, `beforeLoad`, gắn page).
  - `__root.tsx`
  - `_guest.tsx` (chỉ khách, đã đăng nhập → `/market`): `login`, `register`.
  - `_app.tsx` (header, không chặn): `market`.
  - `_app/_authed.tsx` (chưa đăng nhập → `/login?redirect=`): `stocks.$symbol`, `orders`, `portfolio`, `cash`, `margin`, `profile`.
- `features/`: `auth`, `market`, `trading`, `portfolio`, `margin`. Mỗi feature có `api/` (queryOptions + truy vấn Supabase), `hooks/`, `components/`, `pages/`, `schemas.ts` (Zod), `types.ts`.
- `shared/`:
  - `ui/` (shadcn)
  - `components/` (DataTable, FormField cho TanStack Form, ConfirmDialog, EmptyState)
  - `api/` (`supabase.ts`, `database.types.ts`, `queryClient.ts`)
  - `lib/` (`utils.ts`, `format.ts`)
  - `stores/` (Zustand)
  - `constants/`
- `i18n/`: `index.ts`, `vi/<namespace>.json` theo feature.
- `types/`: `i18next.d.ts`, router context.

## Ranh giới bảo mật (bắt buộc)

- Đồ án độc lập, không dùng bất kỳ code, API, thiết kế, tài liệu hay nghiệp vụ nào từ nơi thực tập.
- Không dùng README nội bộ, cấu trúc thư mục hay luồng nghiệp vụ riêng của nơi thực tập.
- Không dựng lại giao diện của nơi thực tập, kể cả khi đã đổi tên, logo hay số liệu.
- Chỉ dùng quy ước chung, công khai của thị trường và tài liệu chính thức của thư viện.
- Không nhắc tên nơi thực tập trong repo.
- `doc/` (kế hoạch, hướng dẫn nội bộ của Minh) nằm trong `.gitignore`, không đưa lên GitHub.

## Cách làm việc

- Không mở rộng phạm vi. Đề xuất thêm gì phải nói rõ tốn bao nhiêu giờ và đổi lấy phần nào.
- Bám tài liệu chính thức của thư viện. Code đơn giản, dễ giải thích khi bảo vệ.
- Trước khi commit: `yarn check` không lỗi, `yarn build` chạy xong, không có file `.env` nào trong `git status`.
