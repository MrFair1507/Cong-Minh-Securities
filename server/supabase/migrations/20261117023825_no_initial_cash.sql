-- CMS: tài khoản mới bắt đầu với 0 đ, người dùng tự nạp từ ngân hàng mô phỏng (bank_links).
-- Tài khoản cũ giữ nguyên số dư và dòng INIT đã có; enum INIT giữ lại cho dữ liệu cũ.
-- Thân hàm giữ nguyên như migration trading, chỉ bỏ vốn ban đầu và dòng INIT.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_id_number text := nullif(v_meta ->> 'id_number', '');
begin
  -- cash_balance lấy default 0 của bảng
  insert into public.profiles (
    id, full_name, phone, id_number,
    date_of_birth, gender, id_issued_on, kyc_verified_at
  )
  values (
    new.id,
    coalesce(v_meta ->> 'full_name', ''),
    nullif(v_meta ->> 'phone', ''),
    v_id_number,
    nullif(v_meta ->> 'date_of_birth', '')::date,
    nullif(v_meta ->> 'gender', ''),
    nullif(v_meta ->> 'id_issued_on', '')::date,
    case when v_id_number is not null then now() end
  );

  return new;
end;
$$;

-- Không còn nơi nào dùng vốn ban đầu
drop function public.initial_cash();
