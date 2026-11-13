# DESIGN.md

Quyết định thiết kế đã chốt cho giao diện CMS. Màn mới làm theo file này.

## Nguồn

- Bản thiết kế gốc: Figma "CMS" (do Minh tự vẽ), trang `InvestSim`, các frame `01`–`14b`. Dựng màn nào thì đọc frame đó.
- Riêng khung app khác Figma: **menu ngang trên header** thay cho sidebar (Minh chọn). Hồ sơ và Đăng xuất nằm trong menu avatar.

## Khung app

- Header cao 64px, viền dưới, dính đỉnh. Nội dung và header cùng khung `max-w-[1200px] px-6` (nội dung rộng 1152px như Figma).
- Trái: logo (ô 28px nền primary, icon TrendingUp) + "CMS", rồi 5 mục: Bảng giá, Lịch sử lệnh, Danh mục, Dòng tiền, Ký quỹ. Khách chỉ thấy Bảng giá.
- Phải: ô tìm mã (Enter mở `/stocks/$symbol`), Tiền mặt, avatar. Khách: nút bánh răng, Đăng nhập (viền), Đăng ký (đặc).
- Menu avatar: tên, email, số tài khoản → Hồ sơ → Giao diện (Sáng / Tối / Theo hệ thống) → Ngôn ngữ (VI / EN) → Đăng xuất. Khách và trang đăng nhập/đăng ký: nút bánh răng mở đúng 2 mục Giao diện, Ngôn ngữ (`shared/components/PreferenceMenu.tsx`).
- Mục đang chọn nền `--border`, rê nền `--muted`.
- Bỏ so với Figma: nút VI/EN rời trên header (đã gom vào menu), chuông thông báo (cảnh báo ký quỹ dùng toast/popup).

## Token

- Font Inter (có tiếng Việt). Bộ xám zinc của shadcn, màu nhấn `--primary` #18181b. Bo góc `--radius` 8px.
- Màu giá: tăng `--price-up` #16a34a, giảm `--price-down` #dc2626, tham chiếu `--price-ref` #ca8a04, trần `--price-ceil` #a21caf, sàn `--price-floor` #0891b2.
- Trạng thái ký quỹ: `--safe`, `--warning`, `--danger` (kèm `-bg`).
- Phong cách: flat. Có 2 theme sáng/tối, mặc định theo hệ thống (`next-themes`, class `dark` trên `<html>`, lưu `cms.theme`). Theme tối dùng zinc đảo ngược (nền #09090b), màu giá sáng hơn một bậc: tăng #22c55e, giảm #ef4444, TC #eab308, trần #e879f9, sàn #22d3ee.
- Cột thương hiệu ở trang đăng nhập/đăng ký luôn nền tối (zinc-900) ở cả 2 theme.

## Bảng giá `/market`

- Bố cục cột theo quy ước chung của bảng giá trên thị trường (không lấy từ giao diện riêng của công ty nào): TC · Trần · Sàn | Bên mua (Giá 3, KL 3 → Giá 1, KL 1) | Mã CK | Khớp lệnh (Giá, KL, +/-) | Tổng KL | Bên bán (Giá 1, KL 1 → Giá 3, KL 3) | TB · Cao · Thấp | NĐTNN (Room, %). 25 cột, header 2 tầng.
- Nền theo theme đang chọn (sáng/tối). Mỗi ô giá (và KL đi kèm) tô theo giá đó so với TC/trần/sàn bằng token `--price-*`. Mã CK và nhóm Khớp lệnh nền `bg-muted/60`.
- Ô đổi giá trị thì nháy nền xanh/đỏ 0,8 giây (tắt khi bật giảm chuyển động).
- Đơn vị: giá × 1.000, khối lượng × 10 (ghi ở footer). Chữ 12px, `tabular-nums`, header dính dưới thanh menu.
- Trang `/market` dùng toàn bộ chiều ngang (`px-4`), các trang khác giữ khung 1200px.
- Không làm: thanh chỉ số, ghim mã, nút đặt lệnh trên bảng.

## Màn đã dựng

- Khung app + trang tạm cho mọi route (bước 1, 09/11).
- Đăng ký 4 bước có eKYC mô phỏng (11/11): ảnh chỉ xử lý trên trình duyệt, số giấy tờ do hệ thống sinh với tiền tố 999, không nhận diện khuôn mặt.
- Bảng giá đủ cột + Realtime (12/11).
