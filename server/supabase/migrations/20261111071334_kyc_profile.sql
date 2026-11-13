create sequence public.account_no_seq;
revoke all on sequence public.account_no_seq from anon, authenticated;

alter table public.profiles
add column phone text check(phone~'^0\d{9}$'),
add id_number text unique check(id_number ~ '^999\d{9}$'),
add column date_of_birth date,
add column gender text check(gender in ('MALE', 'FEMALE')),
add column id_issued_on date,
add kyc_verified_at timestamptz,
add column account_no text not null unique
  default ('CMS' || lpad(nextval('public.account_no_seq')::text, 6, '0'));


alter sequence public.account_no_seq owned by public.profiles.account_no;
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
    v_meta jsonb:= coalesce(new.raw_user_meta_data,'{}'::jsonb);
    v_id_number text:=nullif(v_meta->>'id_number', '');
begin
    insert into public.profiles (id, full_name, cash_balance, phone, id_number, date_of_birth, gender, id_issued_on, kyc_verified_at)
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