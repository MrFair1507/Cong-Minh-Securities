-- CMS: khóa họ tên theo eKYC.
-- Họ tên lấy từ giấy tờ eKYC và là tên chủ tài khoản khi liên kết ngân hàng,
-- nên người dùng không tự sửa được nữa (init_schema từng mở quyền này).
drop policy "Sửa hồ sơ của mình" on public.profiles;
revoke update (full_name) on public.profiles from authenticated;
