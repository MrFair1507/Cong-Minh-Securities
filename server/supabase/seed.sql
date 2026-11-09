-- Dữ liệu mẫu: 2 sàn, 30 mã, 60 phiên nến lịch sử.
-- Giá là số liệu giả lập, không phản ánh giá thật của doanh nghiệp.
-- Chạy được nhiều lần (bỏ qua phần đã có).

insert into public.exchanges (code, name, price_band) values
  ('HOSE', 'Sở Giao dịch Chứng khoán TP.HCM', 0.07),
  ('HNX', 'Sở Giao dịch Chứng khoán Hà Nội', 0.10)
on conflict (code) do nothing;

-- Trần làm tròn xuống, sàn làm tròn lên theo bước giá 100 đ
insert into public.stocks (
  exchange_id, symbol, name, ref_price, ceiling_price, floor_price, price, loan_rate
)
select
  e.id,
  s.symbol,
  s.name,
  s.ref_price,
  floor(s.ref_price * (1 + e.price_band) / 100) * 100,
  ceil(s.ref_price * (1 - e.price_band) / 100) * 100,
  s.ref_price,
  s.loan_rate
from (
  values
    ('HOSE', 'ACB', 'Ngân hàng TMCP Á Châu', 24500, 0.5),
    ('HOSE', 'BID', 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', 45200, 0.5),
    ('HOSE', 'CTG', 'Ngân hàng TMCP Công Thương Việt Nam', 36800, 0.5),
    ('HOSE', 'DGC', 'Công ty CP Tập đoàn Hóa chất Đức Giang', 98500, 0.4),
    ('HOSE', 'FPT', 'Công ty CP FPT', 128000, 0.5),
    ('HOSE', 'GAS', 'Tổng Công ty Khí Việt Nam', 68300, 0.5),
    ('HOSE', 'HPG', 'Công ty CP Tập đoàn Hòa Phát', 26700, 0.5),
    ('HOSE', 'MBB', 'Ngân hàng TMCP Quân đội', 23100, 0.5),
    ('HOSE', 'MSN', 'Công ty CP Tập đoàn Masan', 74600, 0.4),
    ('HOSE', 'MWG', 'Công ty CP Đầu tư Thế Giới Di Động', 61200, 0.5),
    ('HOSE', 'PNJ', 'Công ty CP Vàng bạc Đá quý Phú Nhuận', 88900, 0.4),
    ('HOSE', 'REE', 'Công ty CP Cơ Điện Lạnh', 63400, 0.4),
    ('HOSE', 'SSI', 'Công ty CP Chứng khoán SSI', 27800, 0.5),
    ('HOSE', 'TCB', 'Ngân hàng TMCP Kỹ Thương Việt Nam', 24900, 0.5),
    ('HOSE', 'VCB', 'Ngân hàng TMCP Ngoại thương Việt Nam', 89700, 0.5),
    ('HOSE', 'VHM', 'Công ty CP Vinhomes', 42300, 0.3),
    ('HOSE', 'VIC', 'Tập đoàn Vingroup', 44100, 0.3),
    ('HOSE', 'VJC', 'Công ty CP Hàng không VietJet', 101500, 0.3),
    ('HOSE', 'VNM', 'Công ty CP Sữa Việt Nam', 61500, 0.5),
    ('HOSE', 'VPB', 'Ngân hàng TMCP Việt Nam Thịnh Vượng', 19400, 0.5),
    ('HNX', 'CEO', 'Công ty CP Tập đoàn C.E.O', 15600, 0),
    ('HNX', 'DTD', 'Công ty CP Đầu tư Phát triển Thành Đạt', 28900, 0),
    ('HNX', 'IDC', 'Tổng Công ty IDICO', 52300, 0.3),
    ('HNX', 'MBS', 'Công ty CP Chứng khoán MB', 31200, 0.4),
    ('HNX', 'NVB', 'Ngân hàng TMCP Quốc Dân', 11800, 0),
    ('HNX', 'PVI', 'Công ty CP PVI', 49700, 0.3),
    ('HNX', 'PVS', 'Tổng Công ty CP Dịch vụ Kỹ thuật Dầu khí Việt Nam', 34600, 0.4),
    ('HNX', 'SHS', 'Công ty CP Chứng khoán Sài Gòn - Hà Nội', 16300, 0.4),
    ('HNX', 'TNG', 'Công ty CP Đầu tư và Thương mại TNG', 22400, 0.3),
    ('HNX', 'VCS', 'Công ty CP Vicostone', 58800, 0.3)
) as s (exchange, symbol, name, ref_price, loan_rate)
join public.exchanges e on e.code = s.exchange
on conflict (symbol) do nothing;

-- 60 phiên gần nhất (bỏ thứ 7, chủ nhật). Đi lùi từ ref_price:
-- giá đóng cửa phiên cuối = ref_price của hôm nay.
do $$
declare
  s record;
  days date[];
  i int;
  c numeric; -- giá đóng cửa của phiên đang sinh
  o numeric; -- giá mở cửa = giá đóng cửa phiên trước
  h numeric;
  l numeric;
begin
  if exists (select 1 from public.price_history) then
    return;
  end if;

  perform setseed(0.2026); -- cố định để lần nào seed cũng ra cùng dữ liệu

  select array_agg(d order by d) into days
  from (
    select x::date as d
    from generate_series(current_date - 100, current_date - 1, interval '1 day') as x
    where extract(isodow from x) < 6
    order by x desc
    limit 60
  ) t;

  for s in
    select st.id, st.ref_price, e.price_band
    from public.stocks st join public.exchanges e on e.id = st.exchange_id
    order by st.id
  loop
    c := s.ref_price;
    for i in reverse array_length(days, 1)..1 loop
      -- thay đổi mỗi phiên trong khoảng ±(biên độ / 2)
      o := round(c / (1 + (random() - 0.5) * s.price_band) / 100) * 100;
      h := ceil(greatest(o, c) * (1 + random() * s.price_band / 4) / 100) * 100;
      l := floor(least(o, c) * (1 - random() * s.price_band / 4) / 100) * 100;

      insert into public.price_history (stock_id, trade_date, open, high, low, close, volume)
      values (s.id, days[i], o, h, l, c, (floor(random() * 30000) + 1000)::bigint * 100);

      c := o;
    end loop;
  end loop;
end;
$$;
