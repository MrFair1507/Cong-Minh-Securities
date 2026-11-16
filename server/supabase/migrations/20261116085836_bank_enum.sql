-- Thêm loại dòng tiền cho nộp/rút với ngân hàng mô phỏng.
-- Tách riêng: Postgres không cho dùng giá trị enum vừa thêm trong cùng transaction (migration bank_links dùng chúng).
alter type public.cash_tx_type add value 'DEPOSIT';
alter type public.cash_tx_type add value 'WITHDRAW';
