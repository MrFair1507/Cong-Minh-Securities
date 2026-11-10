# DESIGN.md

Quyết định thiết kế đã chốt cho giao diện CMS. Màn mới làm theo file này.

## Nguồn

- Bản thiết kế gốc: Figma "CMS" (do Minh tự vẽ), trang `InvestSim`, các frame `01`–`14b`. Dựng màn nào thì đọc frame đó.
- Riêng khung app khác Figma: **menu ngang trên header** thay cho sidebar (Minh chọn). Hồ sơ và Đăng xuất nằm trong menu avatar.

## Khung app

- Header cao 64px, viền dưới, dính đỉnh. Nội dung và header cùng khung `max-w-[1200px] px-6` (nội dung rộng 1152px như Figma).
- Trái: logo (ô 28px nền primary, icon TrendingUp) + "CMS", rồi 5 mục: Bảng giá, Lịch sử lệnh, Danh mục, Dòng tiền, Ký quỹ. Khách chỉ thấy Bảng giá.
- Phải: ô tìm mã (Enter mở `/stocks/$symbol`), Tiền mặt, avatar. Khách: nút Đăng nhập (viền) và Đăng ký (đặc).
- Mục đang chọn nền `--border` (#e4e4e7), rê nền `--muted`.
- Bỏ so với Figma: nút VI/EN (chỉ tiếng Việt), chuông thông báo (cảnh báo ký quỹ dùng toast/popup).

## Token

- Font Inter (có tiếng Việt). Bộ xám zinc của shadcn, màu nhấn `--primary` #18181b. Bo góc `--radius` 8px.
- Màu giá: tăng `--price-up` #16a34a, giảm `--price-down` #dc2626, tham chiếu `--price-ref` #ca8a04, trần `--price-ceil` #a21caf, sàn `--price-floor` #0891b2.
- Trạng thái ký quỹ: `--safe`, `--warning`, `--danger` (kèm `-bg`).
- Phong cách: flat, nền sáng, không làm dark mode.

## Màn đã dựng

- Khung app + trang tạm cho mọi route (bước 1, 09/11).
