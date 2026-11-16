-- Rút gọn tên ngân hàng hiển thị trên giao diện (bỏ chữ "mô phỏng")
update public.banks set name = 'Ngân hàng Alpha' where code = 'ALPHA';
update public.banks set name = 'Ngân hàng Beta' where code = 'BETA';
update public.banks set name = 'Ngân hàng Gamma' where code = 'GAMMA';
