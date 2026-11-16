-- CMS: đặt lệnh thị trường bằng tiền mặt (tuần 2)
-- Phí giao dịch 0,15% cả mua và bán, thuế bán 0,1%. Làm tròn tới đồng.
-- Phí, thuế gộp vào dòng BUY/SELL của cash_transactions (không thêm loại mới),
-- chi tiết lưu ở orders.fee, orders.tax. Hằng số phải khớp shared/src/trading.ts.

-- ============================================================
-- Phí và thuế
-- ============================================================
alter table public.orders
  add column fee numeric(18, 2) not null default 0 check (fee >= 0),
  add column tax numeric(18, 2) not null default 0 check (tax >= 0);

create function public.fee_rate()
returns numeric
language sql
immutable
set search_path = ''
as $$ select 0.0015::numeric $$;

create function public.sell_tax_rate()
returns numeric
language sql
immutable
set search_path = ''
as $$ select 0.001::numeric $$;

-- ============================================================
-- Vá handle_new_user: migration kyc_profile dùng create or replace
-- nhưng thiếu set search_path, hàm security definer mất dòng này.
-- Thân hàm giữ nguyên như kyc_profile.
-- ============================================================
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
  insert into public.profiles (
    id, full_name, cash_balance, phone, id_number,
    date_of_birth, gender, id_issued_on, kyc_verified_at
  )
  values (
    new.id,
    coalesce(v_meta ->> 'full_name', ''),
    public.initial_cash(),
    nullif(v_meta ->> 'phone', ''),
    v_id_number,
    nullif(v_meta ->> 'date_of_birth', '')::date,
    nullif(v_meta ->> 'gender', ''),
    nullif(v_meta ->> 'id_issued_on', '')::date,
    case when v_id_number is not null then now() end
  );

  insert into public.cash_transactions (user_id, type, amount, balance_after)
  values (new.id, 'INIT', public.initial_cash(), public.initial_cash());

  return new;
end;
$$;

-- ============================================================
-- place_order: lệnh thị trường, khớp ngay theo stocks.price lúc gọi.
-- Mọi bước chạy trong một transaction (một lần gọi RPC).
-- Lỗi nghiệp vụ trả bằng mã trong message, client tra i18n trading:errors.<MÃ>.
-- ============================================================
create function public.place_order(
  p_symbol text,
  p_side public.order_side,
  p_quantity integer
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stock_id bigint;
  v_price numeric(18, 2);
  v_cash numeric(18, 2);
  v_held integer;
  v_value numeric(18, 2);
  v_fee numeric(18, 2);
  v_tax numeric(18, 2) := 0;
  v_amount numeric(18, 2); -- tiền vào (+) hoặc ra (-) tài khoản
  v_order_id bigint;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity % 100 <> 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select id, price into v_stock_id, v_price
  from public.stocks
  where symbol = upper(p_symbol);
  if not found then
    raise exception 'STOCK_NOT_FOUND';
  end if;

  -- Khóa dòng số dư: hai lệnh gửi cùng lúc phải chờ nhau, không tiêu trùng tiền
  select cash_balance into v_cash
  from public.profiles
  where id = v_user_id
  for update;
  if not found then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  v_value := v_price * p_quantity;
  v_fee := round(v_value * public.fee_rate());

  if p_side = 'BUY' then
    v_amount := -(v_value + v_fee);
    if v_cash + v_amount < 0 then
      raise exception 'INSUFFICIENT_CASH';
    end if;
  else
    select quantity into v_held
    from public.holdings
    where user_id = v_user_id and stock_id = v_stock_id
    for update;
    if coalesce(v_held, 0) < p_quantity then
      raise exception 'INSUFFICIENT_SHARES';
    end if;
    v_tax := round(v_value * public.sell_tax_rate());
    v_amount := v_value - v_fee - v_tax;
  end if;

  insert into public.orders (user_id, stock_id, side, quantity, price, fee, tax)
  values (v_user_id, v_stock_id, p_side, p_quantity, v_price, v_fee, v_tax)
  returning id into v_order_id;

  update public.profiles
  set cash_balance = cash_balance + v_amount
  where id = v_user_id
  returning cash_balance into v_cash;

  insert into public.cash_transactions (user_id, type, amount, balance_after, order_id)
  values (v_user_id, p_side::text::public.cash_tx_type, v_amount, v_cash, v_order_id);

  if p_side = 'BUY' then
    -- Giá vốn bình quân có tính phí mua
    insert into public.holdings as h (user_id, stock_id, quantity, avg_cost)
    values (v_user_id, v_stock_id, p_quantity, round((v_value + v_fee) / p_quantity, 2))
    on conflict (user_id, stock_id) do update
    set quantity = h.quantity + excluded.quantity,
        avg_cost = round(
          (h.quantity * h.avg_cost + v_value + v_fee) / (h.quantity + excluded.quantity),
          2
        );
  elsif v_held = p_quantity then
    -- Bán hết thì xóa dòng (holdings.quantity luôn > 0)
    delete from public.holdings
    where user_id = v_user_id and stock_id = v_stock_id;
  else
    update public.holdings
    set quantity = quantity - p_quantity
    where user_id = v_user_id and stock_id = v_stock_id;
  end if;

  return v_order_id;
end;
$$;

-- Chỉ người đã đăng nhập được gọi
revoke execute on function public.place_order(text, public.order_side, integer)
  from public, anon;
grant execute on function public.place_order(text, public.order_side, integer)
  to authenticated;
