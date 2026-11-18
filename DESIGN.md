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
- Danh mục `/portfolio` (17/11, frame 06):
  - 4 thẻ số liệu: Tổng tài sản (cổ phiếu + tiền mặt), Giá trị cổ phiếu, Lãi/lỗ chưa thực hiện (xanh/đỏ, kèm % so với giá vốn), Tiền mặt (dòng phụ là link "Nạp thêm tiền" sang `/cash`; Figma ghi dư nợ ký quỹ, sẽ thêm khi làm ký quỹ).
  - Lưới `1fr | 340px`: trái bảng Mã (chấm màu) · KL · Giá vốn · Giá hiện tại (màu theo TC/trần/sàn, nháy khi đổi) · Giá trị · Lãi/lỗ (số + %) · Tỷ trọng · nút Bán (mở hộp thoại Đặt lệnh chiều Bán); phải thẻ Tỷ trọng danh mục (biểu đồ vòng shadcn Chart/Recharts, bắt đầu từ đỉnh theo chiều kim đồng hồ, giữa ghi số mã + tổng giá trị gọn, rê chuột vào lát hiện tooltip mã + %; chú thích bên dưới luôn có tên mã và %).
  - Khác Figma: bảng màu tỷ trọng đổi sang 5 màu đã kiểm mù màu (token `--alloc-1..5`, có bản nền tối); 4 màu của Figma không đạt (cặp xanh đậm/vàng quá tối/quá sáng). Mã thứ 6 trở đi gộp "Khác" màu xám. Dòng và màu xếp theo vốn bỏ ra (không theo giá trị) để không đổi chỗ, đổi màu mỗi nhịp giá.
  - Chưa có cổ phiếu: bảng hiện lời nhắc + nút Xem bảng giá, ẩn thẻ tỷ trọng.
- Hồ sơ `/profile` (17/11, frame 09):
  - Kiểu trang cài đặt, lưới `300px | 1fr`, các thẻ canh đỉnh.
  - Trái là thẻ tóm tắt: avatar chữ cái đầu 64px, tên, email, nhãn xanh "Đã xác thực eKYC" (icon BadgeCheck). Dưới đường kẻ là Số tài khoản, Ngày mở tài khoản.
  - Phải là 3 thẻ xếp dọc, mỗi dòng nhãn trái (muted) – giá trị phải (đậm), ngăn bằng đường kẻ:
    - Thông tin cá nhân: Họ tên, Ngày sinh, Giới tính, SĐT, Email.
    - Giấy tờ định danh: Số giấy tờ, Ngày cấp, Ngày xác thực.
    - Bảo mật: chỉ có tiêu đề + mô tả, nút viền "Đổi mật khẩu" bên phải mở hộp thoại 3 ô (Hủy | Đổi mật khẩu).
  - Khác Figma:
    - Không cho sửa họ tên (khóa theo eKYC), không có ô chọn ngôn ngữ (đã ở menu avatar), bỏ dòng Tiền mặt vì header đã có.
    - Bỏ hẳn vùng nguy hiểm "Đặt lại tài khoản" (tài khoản tài chính thật không có chức năng này). Đổi mật khẩu thành hộp thoại thay vì thẻ đặt cạnh thông tin cá nhân.
- Quên mật khẩu `/forgot-password` (18/11, không có trong Figma): cùng khung trang khách với đăng nhập, form rộng 380px.
  - Màn đăng nhập có link "Quên mật khẩu?" canh phải dưới ô mật khẩu.
  - Bước 1: Email, Số giấy tờ, SĐT, nút "Nhận mã OTP".
  - Bước 2: mô tả "đã gửi tới số đuôi …", hộp xám hiện mã (mô phỏng SMS), ô OTP kèm nút "Gửi lại mã", 2 ô mật khẩu mới, nút "Đặt mật khẩu".
  - Dưới cùng là link "← Quay lại đăng nhập".
- Ký quỹ `/margin` (18/11, frame 08 + 12 + 13 + 14/14b; thêm các tab theo nghiệp vụ chung của công ty chứng khoán):
  - Làm lại 18/11 theo skill evon:ui-ux, Minh chọn phương án A "Một trang, tỷ lệ đứng đầu" (bản cũ: 6 thẻ viền rời, tab Gói vay riêng, nhìn "AI").
    - Brief: người dùng là người mới học đầu tư (tiền ảo) và hội đồng xem demo. Việc chính: biết tài khoản còn an toàn không, nợ bao nhiêu, rồi trả nợ hoặc gia hạn. Trước khi vay thì hiểu lời lỗ và chọn gói.
    - Bộ mặt giữ nguyên DESIGN.md (flat, zinc, sáng/tối). Chỉ đổi bố cục và thứ bậc.
  - PageHeader chỉ có tiêu đề + mô tả. Dưới là tab gạch chân có đường kẻ dưới hết chiều ngang: Tổng quan · Danh mục mã ký quỹ · Minh họa khoản vay · Lịch sử (`?tab=`). Không còn tab Gói vay.
  - Tổng quan khi đã mở tài khoản (`MarginHero`), thứ tự từ trên xuống:
    - Một khối, chia `1.15fr | 1fr`. Trái: "Tỷ lệ ký quỹ" + nhãn trạng thái, số 36px (chưa nợ thì "—"), công thức, thanh 0–100% tô màu trạng thái có 3 vạch 30/40/50%, một dòng giải thích ngưỡng. Phải: Dư nợ (24px, gốc · lãi) cạnh nút Trả nợ, dưới là Tổng tài sản và Sức mua có vay. Chân khối nền muted: 2 công tắc Tự động trả nợ, Tự động gia hạn.
    - Bảng Khoản vay. Tiêu đề có số khoản đang vay và đã trả; bên phải là dòng đỏ "n khoản quá hạn, n khoản sắp tới hạn". Cột: Khoản vay (VL-xxxx + "Mua FPT · 1.000 CP") · Gói (tên · lãi) · Ngày vay · Hạn trả (kèm nhãn "Còn n ngày" vàng, "Quá hạn n ngày" đỏ, hoặc "Đã trả hết") · Gốc · Lãi tạm tính · Dư nợ · nút. Nút Gia hạn (ghost) chỉ hiện khi sắp hạn và còn lượt gia hạn; nút Trả nợ là outline. Chưa có khoản vay thì hiện khối rỗng viền đứt và nút "Đến bảng giá".
  - Chưa mở tài khoản: một khối chia `1fr | 320px`. Trái là lời mời, 3 dòng "Bạn cần biết" có icon, nút Mở tài khoản ký quỹ + nút outline "Thử minh họa khoản vay". Phải là ô xám "Tham số mô phỏng".
  - Gói vay luôn nằm trong Tổng quan (cả khi chưa mở tài khoản), dưới bảng khoản vay:
    - 3 ô bấm được. Mỗi ô có: tên + nhãn Đang dùng / Mặc định, lãi 24px ("0% → 14%" cho gói bậc thang), mô tả ngắn, "Lãi khi vay 100 tr × 30 ngày" và số mã áp dụng. Gói đang dùng có viền 2px màu foreground.
    - Bấm ô thì mở popup chi tiết (`PackageDialog`, 640px). Bố cục học từ ảnh Minh chụp, chỉ lấy khung, không ảnh, không banner:
      - 4 chỉ số: Lãi suất · Hạn vay · Mã áp dụng · Gia hạn.
      - Điều kiện sử dụng (dấu ✓ xanh), Cách tính lãi.
      - Thanh ví dụ chia đoạn. Gói Ưu đãi: 100 triệu mã trong rổ + 50 triệu mã ngoài rổ (đoạn ngoài rổ màu cam). Gói Bậc thang: 4 bậc trong 90 ngày (bậc miễn lãi màu xanh).
      - Tiền lãi khi vay 100 triệu trong 7 / 30 / 90 ngày, rổ mã, khung Lưu ý nền vàng.
      - Chân popup: Đóng + Đăng ký gói / Hủy gói. Chưa mở tài khoản thì nút bị khóa.
    - Đăng ký gói loại trừ khi đang dùng gói kia thì hiện hộp thoại xung đột, nút đỏ "Hủy gói …".
  - Cuối Tổng quan: một dòng chú thích nhỏ (QĐ 87, thu nợ cuối phiên, không giải chấp).
  - Token: `--safe` và `--danger` của nền sáng đậm một bậc (`#15803d`, `#b91c1c`) để chữ nhãn trên nền nhạt đạt 4.5:1. Đổi này áp cho mọi màn.
  - Danh mục mã: lọc sàn (tab nhỏ), ô tìm, bảng Mã · Tên · Sàn · Giá · +/− · Tỷ lệ cho vay · Gói áp dụng.
  - Minh họa: cột trái 340px là form (chọn mã, vốn, giá mua, giá bán mục tiêu, số ngày). Phải là lưới thẻ: Chỉ dùng tiền mặt + từng gói; gói lợi nhất có nhãn xanh "Lợi nhuận cao nhất", gói không áp dụng được làm mờ.
  - Lịch sử: chọn giữa Cảnh báo | Dịch vụ; lịch sử dịch vụ luôn có nhãn "Đã duyệt".
  - Hộp thoại:
    - Mở tài khoản (frame 12): thêm khối "Dịch vụ đi kèm" có 2 công tắc.
    - Trả nợ (frame 13): ô số tiền dùng chung `AmountField` (đọc số thành chữ), nút 25% / 50% / Tối đa.
    - Gia hạn: hộp hỏi lại, chưa đủ điều kiện thì ghi lý do và khóa nút.
    - Cảnh báo (frame 14): viền đỏ, nút đỏ "Trả nợ ngay" → `/margin?repay=true`. Toast (frame 14b) khi vào app mà còn cảnh báo mở.
  - Đặt lệnh (frame 10): ô "Dùng vay ký quỹ" có công tắc, nằm trên hộp tổng tiền. Hộp tổng tiền thêm Tiền mặt sử dụng, Vay ký quỹ (cam), Gói áp dụng, Tỷ lệ sau lệnh; dưới là dòng kết luận xanh/đỏ.
  - Khác Figma: menu ngang thay sidebar; mức 40% gọi là "ngưỡng cảnh báo" (Figma ghi "duy trì"); thêm hạn vay, gói vay, các tab học từ nghiệp vụ chung.
- Dưới biểu đồ ở trang chi tiết mã (16/11) có 2 thẻ chia đôi chiều ngang (không có trong Figma):
  - Dư mua – dư bán: thanh tỷ lệ xanh/đỏ, bảng 3 bước giá có thanh nền mờ theo KL.
  - Khớp lệnh gần nhất: 30 dòng, cuộn trong thẻ; cột Thời gian (giờ:phút:giây), Giá, +/-, KL, M/B; trên đầu ghi tổng KL mua chủ động và bán chủ động.
