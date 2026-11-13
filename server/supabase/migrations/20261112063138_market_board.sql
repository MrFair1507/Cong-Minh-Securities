-- Bảng giá theo bố cục chung của thị trường: sổ lệnh 3 bước giá, cao/thấp/TB trong phiên,
-- room nhà đầu tư nước ngoài. Mọi cột do simulator ghi (secret key).
-- Sổ lệnh chỉ để hiển thị: lệnh thị trường vẫn khớp theo stocks.price.
-- (Nội dung khớp đúng với bản đã chạy trên cloud ngày 12/11.)

alter table public.stocks
  add column last_volume bigint not null default 0 check (last_volume >= 0), -- KL khớp gần nhất
  add column high_price numeric(18, 2),
  add column low_price numeric(18, 2),
  add column total_value numeric(22, 2) not null default 0,     -- TB = total_value / volume
  add column bid_prices numeric(18, 2)[] not null default '{}',  -- [giá mua 1, 2, 3], giá 1 cao nhất
  add column bid_volumes bigint[] not null default '{}',
  add column ask_prices numeric(18, 2)[] not null default '{}',  -- [giá bán 1, 2, 3], giá 1 thấp nhất
  add column ask_volumes bigint[] not null default '{}',
  add column foreign_limit bigint not null default 0,            -- tổng room NĐTNN
  add column foreign_room bigint not null default 0;             -- room còn lại

update public.stocks set
  high_price = price,
  low_price = price,
  foreign_limit = (100 + floor(random() * 900))::bigint * 490000,
  foreign_room = 0;
update public.stocks set foreign_room = (foreign_limit * (0.05 + random() * 0.9))::bigint;
