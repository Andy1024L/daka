create table if not exists public.check_in_records (
  id text primary key,
  timestamp bigint not null,
  date date not null,
  category text not null check (category in ('锻炼', '拉伸')),
  duration integer not null check (duration > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists check_in_records_date_idx on public.check_in_records (date desc);
create index if not exists check_in_records_timestamp_idx on public.check_in_records (timestamp desc);

alter table public.check_in_records enable row level security;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists check_in_records_set_updated_at on public.check_in_records;
create trigger check_in_records_set_updated_at
before update on public.check_in_records
for each row
execute function public.set_updated_at();
