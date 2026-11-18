-- CMS: quên mật khẩu bằng OTP mô phỏng (thay cho gửi SMS thật).
-- Bước 1: khách nhập email + số giấy tờ + số điện thoại, khớp hồ sơ eKYC thì nhận mã OTP.
-- Bước 2: nhập OTP + mật khẩu mới, đúng mã thì đổi mật khẩu trong auth.users.
--
-- Vì sao sửa thẳng auth.users: app không có server riêng nên không gọi được Admin API.
-- Supabase Auth lưu mật khẩu dạng bcrypt, nên băm bằng crypt(..., gen_salt('bf')) của pgcrypto
-- thì đăng nhập bằng signInWithPassword vẫn chạy bình thường.

-- ============================================================
-- Mã OTP đặt lại mật khẩu: mỗi tài khoản tối đa 1 mã, hết hạn sau 5 phút,
-- sai 5 lần thì hủy mã, xin mã mới phải cách mã cũ 60 giây.
-- Client không đọc được bảng này (không grant, không policy).
-- ============================================================
create table public.password_reset_otps (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  code text not null check (code ~ '^[0-9]{6}$'),
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

revoke all on public.password_reset_otps from anon, authenticated;
alter table public.password_reset_otps enable row level security;

-- ============================================================
-- request_password_reset: kiểm 3 thông tin, đúng thì tạo OTP và trả về cho giao diện hiện lên.
-- Sai thông tin chỉ báo chung RESET_INFO_MISMATCH, không lộ email nào đã có tài khoản.
-- ============================================================
create function public.request_password_reset(p_email text, p_id_number text, p_phone text)
returns table (code text, phone_tail text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user_id uuid;
  v_code text;
begin
  select p.id into v_user_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(trim(coalesce(p_email, '')))
    and p.id_number = trim(coalesce(p_id_number, ''))
    and p.phone = trim(coalesce(p_phone, ''));

  if v_user_id is null then
    raise exception 'RESET_INFO_MISMATCH';
  end if;

  if exists (
    select 1 from public.password_reset_otps o
    where o.user_id = v_user_id and o.created_at > now() - interval '60 seconds'
  ) then
    raise exception 'OTP_TOO_SOON';
  end if;

  v_code := lpad(floor(random() * 1000000)::int::text, 6, '0');
  insert into public.password_reset_otps (user_id, code, attempts, created_at, expires_at)
  values (v_user_id, v_code, 0, now(), now() + interval '5 minutes')
  on conflict (user_id) do update
    set code = excluded.code,
        attempts = 0,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at;

  return query select v_code, right(trim(p_phone), 3);
end;
$$;

-- ============================================================
-- reset_password: kiểm OTP rồi đổi mật khẩu.
-- Trả về mã kết quả thay vì raise exception: raise sẽ hủy cả transaction,
-- làm mất lần đếm sai (attempts) vừa ghi.
--   OK            đổi thành công, mã bị xóa, mọi phiên đăng nhập cũ bị đăng xuất
--   OTP_INVALID   sai mã (hoặc email không có mã nào đang chờ)
--   OTP_EXPIRED   mã quá 5 phút
--   OTP_LOCKED    sai lần thứ 5, mã bị hủy
-- ============================================================
create function public.reset_password(p_email text, p_code text, p_new_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_otp public.password_reset_otps;
begin
  -- Supabase Auth: tối thiểu theo cài đặt dự án; bcrypt chỉ đọc 72 byte đầu
  if p_new_password is null
    or length(p_new_password) < 8
    or octet_length(p_new_password) > 72 then
    raise exception 'WEAK_PASSWORD';
  end if;

  select o.* into v_otp
  from public.password_reset_otps o
  join auth.users u on u.id = o.user_id
  where lower(u.email) = lower(trim(coalesce(p_email, '')))
  for update of o;

  if not found then
    return 'OTP_INVALID';
  end if;

  if v_otp.expires_at < now() then
    delete from public.password_reset_otps where user_id = v_otp.user_id;
    return 'OTP_EXPIRED';
  end if;

  if v_otp.code <> coalesce(p_code, '') then
    if v_otp.attempts + 1 >= 5 then
      delete from public.password_reset_otps where user_id = v_otp.user_id;
      return 'OTP_LOCKED';
    end if;
    update public.password_reset_otps
    set attempts = attempts + 1
    where user_id = v_otp.user_id;
    return 'OTP_INVALID';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where id = v_otp.user_id;

  -- Đăng xuất mọi nơi: xóa phiên thì refresh token xóa theo (on delete cascade)
  delete from auth.sessions where user_id = v_otp.user_id;
  delete from public.password_reset_otps where user_id = v_otp.user_id;
  return 'OK';
end;
$$;

-- Khách chưa đăng nhập (anon) phải gọi được thì mới dùng ở màn đăng nhập
revoke execute on function public.request_password_reset(text, text, text) from public;
revoke execute on function public.reset_password(text, text, text) from public;
grant execute on function public.request_password_reset(text, text, text) to anon, authenticated;
grant execute on function public.reset_password(text, text, text) to anon, authenticated;
