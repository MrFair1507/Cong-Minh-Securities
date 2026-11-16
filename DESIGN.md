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
- Màu giá: tăng `--price-up` #15803d, giảm `--price-down` #dc2626, tham chiếu `--price-ref` #a16207, trần `--price-ceil` #a21caf, sàn `--price-floor` #0e7490 (16/11: đậm một bậc so với bản đầu để chữ 12px đạt 4.5:1 trên nền trắng).
- Header bảng giá: chữ `text-foreground/70`; nền tối dùng `bg-card` vì `--muted` trùng `--border`.
- Trạng thái ký quỹ: `--safe`, `--warning`, `--danger` (kèm `-bg`).
- Phong cách: flat. Có 2 theme sáng/tối, mặc định theo hệ thống (`next-themes`, class `dark` trên `<html>`, lưu `cms.theme`). Theme tối dùng zinc đảo ngược (nền #09090b), màu giá sáng hơn một bậc: tăng #22c55e, giảm #ef4444, TC #eab308, trần #e879f9, sàn #22d3ee.
- Cột thương hiệu ở trang đăng nhập/đăng ký luôn nền tối (zinc-900) ở cả 2 theme.

## Bảng giá `/market`

- Bố cục cột theo quy ước chung của bảng giá trên thị trường (không lấy từ giao diện riêng của công ty nào): TC · Trần · Sàn | Bên mua (Giá 3, KL 3 → Giá 1, KL 1) | Mã CK | Khớp lệnh (Giá, KL, +/-) | Tổng KL | Bên bán (Giá 1, KL 1 → Giá 3, KL 3) | TB · Cao · Thấp | NĐTNN (Room, %). 25 cột, header 2 tầng.
- Nền theo theme đang chọn (sáng/tối). Mỗi ô giá (và KL đi kèm) tô theo giá đó so với TC/trần/sàn bằng token `--price-*`. Mã CK và nhóm Khớp lệnh nền `bg-muted/60`.
- Ô đổi giá trị thì nháy nền xanh/đỏ 0,8 giây (tắt khi bật giảm chuyển động).
- Đơn vị: giá × 1.000, khối lượng × 10 (ghi ở footer). Chữ 12px, `tabular-nums`, header dính dưới thanh menu.
- Trang `/market` dùng toàn bộ chiều ngang (`px-4`), các trang khác giữ khung 1200px.
- Bấm ô giá để mở panel đặt lệnh (16/11): giá bán 1–3 và giá khớp mở chiều Mua, giá mua 1–3 mở chiều Bán. Mỗi ô giá là `<button>` có `aria-label`. Dòng của mã đang mở tô `bg-primary/10`.
- Panel đặt lệnh (không có trong Figma, dựng theo token sẵn có): `<aside>` rộng 360px dính bên phải (`sticky top-20`, tự cuộn). Trạng thái nằm trên URL `?trade=FPT&side=BUY`. Đầu panel có tiêu đề, ô chọn mã (Popover + Command, gõ không dấu vẫn tìm được tên có dấu), link sang chi tiết mã, nút đóng. Thân panel dùng lại form của hộp thoại đặt lệnh (xếp một cột), dưới cùng là Dư mua – dư bán. Đặt xong một lệnh thì form trống lại, panel vẫn mở. Esc hoặc nút X để đóng. Khách thấy lời nhắc đăng nhập.
- Panel mở thì bảng giá ẩn cột Giá/KL 3, TB, Cao, Thấp, NĐTNN để vừa 1.000px còn lại (ở 1440px) và giữ header dính. Không bọc khung cuộn ngang vì sẽ mất header dính.
- Không làm: thanh chỉ số, ghim mã, loại lệnh khác ngoài lệnh thị trường.

## Màn đã dựng

- Khung app + trang tạm cho mọi route (bước 1, 09/11).
- Đăng ký 4 bước có eKYC mô phỏng (11/11): ảnh chỉ xử lý trên trình duyệt, số giấy tờ do hệ thống sinh với tiền tố 999, không nhận diện khuôn mặt.
- Bảng giá đủ cột + Realtime (12/11).
- Chi tiết mã `/stocks/$symbol` (13/11, frame 04): đầu trang (mã + sàn + tên, giá lớn nháy khi đổi, +/- và %), nút Bán/Mua (chờ tuần 2). Lưới `1fr | 320px`: trái biểu đồ nến ngày + cột KL (cao 420px, chọn 1T/3T/6T/1N); phải thẻ Thông tin giao dịch và thẻ Đang nắm giữ (nền muted, chỉ hiện khi có cổ phiếu).
- Dòng tiền `/cash` (16/11, frame 07):
  - Theo Figma: 3 thẻ số liệu (số dư, tiền vào và tiền ra 7 ngày, không tính vốn ban đầu), tab lọc loại, bảng gồm Thời gian · Loại (nhãn màu) · Mô tả · Tham chiếu · Số tiền · Số dư sau.
  - Thêm ngoài Figma:
    - Nút Rút tiền và Nộp tiền ở đầu trang. Thẻ "Ngân hàng liên kết" (ô chữ cái thay logo, số TK che 4 số cuối, số dư ngân hàng ảo, nút hủy liên kết có hỏi lại).
    - Hộp thoại Liên kết: chọn ngân hàng bằng thẻ radio, nhập số TK, tên chủ TK khóa theo eKYC. Bước xác nhận có bảng tóm tắt, ô lưu ý, ô đồng ý điều khoản và khối OTP (mã hiện ngay trên hộp thoại).
    - Hộp thoại Nộp tiền: tab Nộp nhanh / Chuyển khoản QR. Tab QR có mã QR, các dòng thông tin có nút sao chép và nội dung bắt buộc `NAP <số TK CK>`. Nút ghi "Tôi đã chuyển khoản".
    - Hộp thoại Rút tiền: chọn TK, nút 25–100% tiền mặt, xác nhận bằng OTP.
  - Ý tưởng là cách làm chung của các sàn. Bố cục tự dựng, không dùng tên hay logo ngân hàng thật.
- Hộp thoại Đặt lệnh nâng cấp (16/11): nút −/+ một lô hai bên ô khối lượng, hàng nút 25/50/75/100% của KL tối đa (khóa khi ra 0 CP), thẻ Sức mua/Có thể bán thêm dòng KL tối đa. Khi bán có dòng Lãi/lỗ tạm tính (màu tăng/giảm/tham chiếu). Bước xác nhận cũng có dòng này.
- Dưới biểu đồ ở trang chi tiết mã (16/11) có 2 thẻ chia đôi chiều ngang (không có trong Figma):
  - Dư mua – dư bán: thanh tỷ lệ xanh/đỏ, bảng 3 bước giá có thanh nền mờ theo KL.
  - Khớp lệnh gần nhất: 30 dòng, cuộn trong thẻ; cột Thời gian (giờ:phút:giây), Giá, +/-, KL, M/B; trên đầu ghi tổng KL mua chủ động và bán chủ động.
