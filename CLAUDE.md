# CLAUDE.md

Đồ án thực tập tốt nghiệp, Minh làm một mình, hạn khoảng 02/12/2026. Trả lời tiếng Việt, ngắn gọn, đi thẳng vào việc.

## Bối cảnh

- CMS (Cong Minh Securities): web mô phỏng đầu tư chứng khoán có ký quỹ. Vốn ảo 100 triệu VND, giá do script Node giả lập. Kiến thức ký quỹ chỉ lấy từ nguồn công khai (QĐ 87/QĐ-UBCK).
- Phạm vi: 7 nhóm chức năng, 9 trang, 5 hộp thoại. Chỉ lệnh thị trường. Ký quỹ chỉ cảnh báo, không tự bán giải chấp. Vie/EN, chỉ desktop.
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
- Xong shadcn/ui (bước 2.4): base radix, preset nova. Font đã đổi sang Inter (`@fontsource-variable/inter`) theo Figma. Component nằm ở `client/src/shared/ui/`. shadcn 4.x dùng gói `cn` (thay clsx + tailwind-merge), component import thẳng `from "cn"`. Thêm component: `cd client` rồi `corepack yarn dlx shadcn@latest add <tên>`.
- `biome.json` bật `css.parser.tailwindDirectives` để Biome đọc được `@apply`, `@theme`.
- Git: nhánh `main`, remote `origin` = GitHub `MrFair1507/Cong-Minh-Securities`. Claude không push được (không nhập được thông tin đăng nhập): Minh tự `git push`. `.gitattributes` giữ LF cho Biome. `doc/` bị ignore.
- Đã đổi tên workspace `be` → `server` (tài liệu trong `doc/` vẫn ghi `be`).
- Đã tạo khung `server/` (package.json, tsconfig.json, .env.example). Project Supabase "CMS" ở `ap-southeast-1` (Singapore); CLI đã login, `init` (`server/supabase/config.toml`, project_id "cms") và `link`. Chạy lệnh CLI trong `server/`: `corepack yarn supabase <lệnh>`. `.claude/settings.json` chặn Claude đọc/sửa file `.env`.
- Xong migration `init_schema` (10 bảng, ràng buộc, trigger tạo profile 100 triệu, RLS chỉ đọc, Realtime `stocks` + `margin_calls`) và `seed.sql` (2 sàn, 30 mã, 60 phiên nến), đã push lên cloud; `database.types.ts` đã sinh thật. Ghi dữ liệu nghiệp vụ chỉ qua RPC (tuần 2). Ngưỡng ký quỹ lưu ở `margin_accounts` (0.5 / 0.4 / 0.3), `shared/margin.ts` nhận ngưỡng qua tham số.
- Supabase CLI 3.0 mặc định nhắm DB cục bộ: lệnh tới cloud phải có `--remote` (script `db:push`, `db:types` đã thêm). Máy không có Docker. Migration mới: `corepack yarn supabase migration new <tên>` trong `server/`, không sửa migration đã push.
- Xong simulator (Bước 5), đã chạy thử với DB cloud: `server/simulator/index.ts` (vòng lặp 3 giây, mỗi nhịp đổi 5 mã ngẫu nhiên, cập nhật `stocks` + nến hôm nay, sang ngày mới theo giờ VN thì tham chiếu = giá đóng cửa, tính lại trần/sàn), `price.ts` (hàm thuần: làm tròn bước giá, trần/sàn, biến động), `margin-watch.ts` (dùng `@cms/shared/margin` tạo/đóng `margin_calls`). Cờ demo: `--trend=down|up` (mọi mã ±1,5% mỗi nhịp), `--session=<giây>` (phiên nhanh để giảm quá biên độ một phiên). Kiểu DB import type-only từ `client/src/shared/api/database.types.ts`. Typecheck server: `corepack yarn workspace server tsc -p .`. `yarn dev` ở gốc đã chạy được.
- Thiết kế: Figma "CMS" của Minh (fileKey `zH4VPGRZBWQM4VF7go2IA7`, trang `InvestSim`, frame 01–14b cho 9 trang + 5 hộp thoại + component). Đọc qua Figma MCP. Quyết định thiết kế ghi ở `DESIGN.md` (gốc repo): menu ngang trên header thay sidebar, bỏ nút VI/EN và chuông. Skill `evon:ui-ux` cài qua `.claude/settings.local.json` (không commit).
- Xong bước 1 tuần 1 (khung app + i18n): token zinc + màu giá trong `index.css`; TanStack Query (`shared/api/queryClient.ts`), i18next (`i18n/index.ts`, `vi/common.json`, kiểu key ở `types/i18next.d.ts`); router context `{ queryClient }` + `session` lấy ở `__root` beforeLoad, `onAuthStateChange` gọi `router.invalidate()`; route `_app` (header) → `market`, `_app/_authed` (guard → `/login?redirect=`) → orders, portfolio, cash, margin, profile, `stocks/$symbol`; `_guest` → login (validateSearch Zod), register. Các trang này đang là `PlaceholderPage`. `shared/components`: AppHeader, Logo, PageHeader, PlaceholderPage; `shared/lib/format.ts`; `features/auth/api/profile.ts`.
- Xong đăng ký 4 bước (eKYC mô phỏng, kế hoạch `~/.claude/plans/b-c-ti-p-theo-l-snoopy-dewdrop.md`): migration `kyc_profile` đã push (cột KYC, `account_no` CMS000xxx, check `id_number ~ '^999\d{9}$'`, trigger đọc metadata), wizard ở `features/auth/components/register/`, `features/auth/lib/mockIdentity.ts`, route `/register?completed=`. Supabase cloud phải tắt "Confirm email". Còn: kiểm thử thủ công.
- Xong bảng giá `/market` (12/11, kế hoạch `~/.claude/plans/tingly-sparking-minsky.md`): migration `market_board` (stocks thêm `last_volume`, `high_price`/`low_price` cho phép null, `total_value`, `bid_/ask_prices`/`_volumes` dạng mảng 3 bước, `foreign_limit`/`foreign_room`); simulator dựng sổ lệnh (`buildOrderBook` trong `price.ts`). Client: `features/market/` (api `stocksQueryOptions` + `BoardStock`, `useStocksRealtime` ghi thẳng vào cache Query, không dùng Zustand; `lib/board.ts` tô màu/lọc; `boardColumns.tsx` 25 cột 2 tầng; `BoardValue` nháy ô). TanStack Table là **v9** (`useTable` + `tableFeatures`, gộp cột bằng `column.columns([...])`). Search params `exchange`, `q`, `sort` (`-volume`...). Lệnh `db push`/`db query` tới cloud cần `--yes` khi Claude chạy, đọc dùng `--read-only`. 13/11: Realtime đã kiểm tra bằng script với publishable key (anon nhận đủ UPDATE); giao diện chưa xem trên trình duyệt. Simulator chạy trên máy, không tự chạy trên cloud: giá chỉ nhảy khi `yarn dev` / `yarn workspace server start` đang chạy.
- Xong theme sáng/tối/hệ thống (12/11): `next-themes` bọc ở `main.tsx` (key `cms.theme`), script chống nháy trong `client/index.html`, khối `.dark` trong `index.css` (zinc + màu giá tối). VI/EN và Giao diện gom vào `shared/components/PreferenceMenu.tsx` (menu avatar; khách dùng nút bánh răng); đã xóa `LanguageSwitcher.tsx`.
- Xong chi tiết mã `/stocks/$symbol` (13/11, frame 04): dùng lại cache `['stocks']` + `useStocksRealtime` của bảng giá; loader `notFound()` khi sai mã. Nến từ `price_history` (`api/priceHistory.ts`), nến cuối ghép giá đang chạy (`lib/candles.ts`: `withLiveCandle`, `filterRange` 1T/3T/6T/1N). `CandleChart.tsx` dùng lightweight-charts **v5** (`addSeries(CandlestickSeries)`), màu đọc từ biến CSS + MutationObserver theo theme. Thẻ Thông tin giao dịch, thẻ Đang nắm giữ (`features/portfolio/api/holdings.ts`, ẩn khi chưa có). Nút Mua/Bán đang `disabled` chờ hộp thoại Đặt lệnh (tuần 2). Hằng `TICK_SIZE`, `LOT_SIZE` ở `shared/constants/market.ts`. Chưa xem trên trình duyệt.
  -- Xong `/profile` chỉ đọc (16/11, commit `435211d`): trang `features/auth/pages/Profiles.tsx`, 2 thẻ Tài khoản + Định danh (eKYC); `_authed` beforeLoad trả `session` không null cho route con; `format.ts` thêm `formatDateTime` (timestamptz → dd/mm/yyyy giờ VN). Sửa tên, đặt lại tiền ảo (cần RPC) để tuần 2; đổi mật khẩu chưa làm.
- TanStack Query 5.107 đánh dấu `ensureQueryData` là deprecated: loader dùng `queryClient.query({ ...options, staleTime: 'static' })`.
- Hoãn deploy Vercel (16/11, chưa đăng nhập được Vercel vì không có điện thoại). Có điện thoại thì làm theo checklist (khoảng 30 phút): Root Directory `client`, env `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `ENABLE_EXPERIMENTAL_COREPACK=1`; Supabase Auth URL Configuration thêm domain Vercel.
- Còn của tuần 1: xem trên trình duyệt các trang đăng ký, đăng nhập, `/market`, `/stocks/$symbol`, `/profile` (chưa xem lần nào).
- Kế hoạch tuần 2: `~/.claude/plans/xem-va-len-kec-stateless-falcon.md`. Minh chốt: bán khi còn nợ thì tiền về tiền mặt, tự trả nợ; **có phí 0,15% (mua và bán) + thuế bán 0,1%**; tuần 2 làm cả sửa tên và đặt lại tiền ảo ở `/profile`.
- Xong 16–18/11 (làm ngày 16/11, chưa commit):
  - Migration `trading` đã push: `orders.fee`/`orders.tax`, hàm `fee_rate()`/`sell_tax_rate()`, vá `handle_new_user` (thêm `set search_path = ''` bị mất ở `kyc_profile`), RPC `place_order(p_symbol, p_side, p_quantity) returns bigint` (khóa `profiles for update`, phí/thuế gộp vào dòng BUY/SELL của `cash_transactions`, giá vốn có tính phí mua, bán hết thì xóa holdings; lỗi trả mã trong message: `INVALID_QUANTITY`, `STOCK_NOT_FOUND`, `INSUFFICIENT_CASH`, `INSUFFICIENT_SHARES`, `NOT_AUTHENTICATED`; chỉ `authenticated` được execute). Đã kiểm bằng SQL (transaction tự rollback) và trên trình duyệt.
  - `shared/src/trading.ts` (`@cms/shared/trading`): `FEE_RATE`, `SELL_TAX_RATE`, `orderCost`, `maxBuyQuantity`. Đổi số thì đổi cả hàm SQL.
  - `features/trading/`: `api/placeOrder.ts` (`usePlaceOrder`, invalidate `profile`/`holdings`/`orders`/`cash`), `OrderDialog` → `OrderForm` (frame 10, TanStack Form + Zod chỉ kiểm định dạng, giới hạn tối đa tính theo giá sống) → `OrderConfirm` (frame 11). Nút Mua/Bán ở `StockPage` đã bật. Nhánh vay ký quỹ chưa làm (21/11).
  - `shared/components/DataTable.tsx` (TanStack Table v9 + `rowPaginationFeature`, 20 dòng/trang, `createDataColumnHelper`). `/orders` (frame 05, `?side=&symbol=`, lọc ở client). `FormField` thêm prop `hint`; `format.ts` thêm `formatTime`; i18n namespace `trading`.
  - Sửa bảng giá theo bản soi: màu giá nền sáng đậm một bậc, header bảng `text-foreground/70`, nền tối `dark:bg-card`.
  - Tài khoản test trên cloud: `test.order.1794811190122@example.com` / `Test@12345` (đang giữ 700 FPT, tiền mặt khoảng 9 triệu).
- Xong nâng cấp mua/bán (16/11, chưa commit; chỉ lấy ý chung của các sàn, không dựng lại giao diện nơi thực tập):
  - Bước 1:
    - `shared/src/trading.ts` thêm `sellProfit`; `features/trading/lib/order.ts` thêm `quickQuantity`, `stepQuantity`.
    - `OrderForm` có nút −/+, nút 25–100%, dòng KL tối đa. `OrderCostRows` hiện lãi/lỗ tạm tính khi bán. `FormField` thêm slot `before`/`after`.
  - Bước 2: `features/market/components/OrderBookCard.tsx` (`OrderBook` + `OrderBookCard`), `lib/board.ts` thêm `bookSummary`, `sideTotals`.
  - Bước 3, khớp lệnh:
    - Migration `market_trades` đã push: bảng `trades` (`stock_id`, `price`, `volume`, `side` = bên chủ động), ai cũng đọc được, có Realtime.
    - Simulator ghi một dòng cho mỗi mã khớp trong nhịp; sang ngày mới thì xóa khớp lệnh ngày cũ. `price.ts` thêm `tradeSide`.
    - Client: `api/trades.ts`, `hooks/useTradesRealtime.ts`, `RecentTradesCard.tsx`. `format.ts` thêm `formatClock`. Đã kiểm khách nhận INSERT qua Realtime.
  - Bước 4, panel:
    - `features/trading/components/OrderSteps.tsx` tách khỏi Dialog. `OrderSurface.tsx` chọn header/footer theo `dialog` | `panel`.
    - `TradePanel.tsx`, `StockPicker.tsx` (shadcn `command` + `popover`, `cmdk`; `CommandInput` tự viết lại, không dùng `input-group`). `shared/lib/text.ts` có `foldText` (bỏ dấu).
    - `/market?trade=&side=`; `boardColumns(t, onTrade)`, `PriceBoard` có `compact` (ẩn cột bằng `columnVisibilityFeature`).
  - Phải khởi động lại `yarn dev` để simulator chạy code mới (có ghi `trades`). Còn simulator mồ côi PID 13760/28292 đang chạy code cũ.
- Xong `/cash` + liên kết ngân hàng mô phỏng (16/11, kéo sớm phần `/cash` của 20/11, chưa commit). Minh chốt: số dư ngân hàng ảo khép kín, có OTP mô phỏng, có QR.
  - Migration `bank_enum` (thêm `DEPOSIT`/`WITHDRAW` vào `cash_tx_type`, tách riêng vì enum mới không dùng được trong cùng transaction) và `bank_links`, đã push.
    - Bảng `banks` (ALPHA/BETA/GAMMA, tên tự đặt) và `bank_links` (hủy liên kết chỉ đặt `unlinked_at`; tối đa 2 liên kết; mỗi liên kết có sẵn 500 triệu ảo qua `mock_bank_balance()`). Bảng `bank_otps`: client không đọc được.
    - `cash_transactions` thêm cột `bank_link_id` và viết lại CHECK.
    - RPC: `request_bank_otp(p_purpose)` trả mã về cho giao diện, `link_bank` (bắt buộc eKYC, tên chủ TK lấy từ `full_name`), `unlink_bank`, `deposit_cash`, `withdraw_cash` (cần OTP; còn nợ ký quỹ thì báo `MARGIN_DEBT_OUTSTANDING`).
    - `consume_bank_otp` và `check_transfer_amount` là hàm nội bộ. Đã kiểm 17 trường hợp bằng SQL (rollback) và kiểm quyền.
  - `features/cash/`:
    - `api/` gồm `cash.ts`, `banks.ts`, `bankActions.ts`. `lib/cash.ts` gồm `flowTotals` (bỏ INIT), `maskAccount`, `parseMoney`, `depositQrPayload` (`CMS-MOCK|…`, cố ý không theo chuẩn thanh toán thật).
    - Component: `BankParts` (ChoiceCards, AmountField, OtpField, CopyRow), `LinkBankDialog`, `DepositDialog` (tab Nộp nhanh / Chuyển khoản QR, dùng `qrcode.react`), `WithdrawDialog`, `BankAccounts`, `cashColumns`, `pages/CashPage.tsx`.
  - `/cash?type=`. Thêm `shared/components/ConfirmDialog.tsx` và i18n namespace `cash`.
  - `shared/lib/numberWords.ts`: `moneyToWords(amount, language)` đọc số tiền thành chữ (vi: "Mười một triệu một trăm nghìn đồng", có linh/lăm/mốt/tư/không trăm/nghìn tỷ; en: "Eleven million one hundred thousand dong"). Hiện dưới ô số tiền của `AmountField` và được gắn vào `aria-describedby`.
  - Tài khoản test có eKYC: `test.bank.<số>@example.com` / `Test@12345` (tạo khi chạy e2e, vài tài khoản; tài khoản cuối là `test.bank.1794820239357@example.com`).
- Tiếp theo: 19/11 `/portfolio` · 20/11 migration `margin` (`/cash` đã làm sớm) · 21/11 `/margin` + 2 hộp thoại ký quỹ + nhánh vay · 22/11 cảnh báo ký quỹ, demo, `/profile` sửa tên + `reset_account`.
- Yarn 1 global đã gỡ; corepack đã bật không cần admin bằng `corepack enable --install-directory "%APPDATA%\npm" yarn`. Gõ `yarn` trực tiếp là ra 4.18.1 (terminal mở trước khi sửa thì mở lại).
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

-không tạo-tác động trựa tiếp vào workspace, gửi code lên chat để tôi xem xét qua và tôi sẽ tự thao tác lại lên ws.

- Không mở rộng phạm vi. Đề xuất thêm gì phải nói rõ tốn bao nhiêu giờ và đổi lấy phần nào.
- Bám tài liệu chính thức của thư viện. Code đơn giản, dễ giải thích khi bảo vệ.
- Trước khi commit: `yarn check` không lỗi, `yarn build` chạy xong, không có file `.env` nào trong `git status`.
