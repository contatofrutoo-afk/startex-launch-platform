begin;

create table if not exists public.payment_settings (
  provider text primary key check (provider = 'mercadopago'),
  enabled boolean not null default false,
  sandbox boolean not null default false,
  public_key text not null default '',
  access_token text not null default '',
  webhook_secret text not null default '',
  user_id text not null default '',
  integrator_id text not null default '',
  site_id text not null default 'MLB',
  subscription_plan_id text not null default '',
  pix_key text not null default '',
  statement_descriptor text not null default '',
  notification_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.payment_settings add column if not exists enabled boolean not null default false;
alter table public.payment_settings add column if not exists sandbox boolean not null default false;
update public.payment_settings set sandbox = false where sandbox is distinct from false;
alter table public.payment_settings add column if not exists public_key text not null default '';
alter table public.payment_settings add column if not exists access_token text not null default '';
alter table public.payment_settings add column if not exists webhook_secret text not null default '';
alter table public.payment_settings add column if not exists user_id text not null default '';
alter table public.payment_settings add column if not exists integrator_id text not null default '';
alter table public.payment_settings add column if not exists site_id text not null default 'MLB';
alter table public.payment_settings add column if not exists subscription_plan_id text not null default '';
alter table public.payment_settings add column if not exists pix_key text not null default '';
alter table public.payment_settings add column if not exists statement_descriptor text not null default '';
alter table public.payment_settings add column if not exists notification_url text not null default '';
alter table public.payment_settings add column if not exists created_at timestamptz not null default now();
alter table public.payment_settings add column if not exists updated_at timestamptz not null default now();
alter table public.payment_settings add column if not exists updated_by uuid references auth.users(id) on delete set null;

create or replace function public.set_payment_settings_metadata()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists payment_settings_metadata on public.payment_settings;
create trigger payment_settings_metadata
  before insert or update on public.payment_settings
  for each row execute function public.set_payment_settings_metadata();

alter table public.payment_settings enable row level security;

drop policy if exists "Admins leem configuracoes de pagamento" on public.payment_settings;
create policy "Admins leem configuracoes de pagamento" on public.payment_settings
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins criam configuracoes de pagamento" on public.payment_settings;
create policy "Admins criam configuracoes de pagamento" on public.payment_settings
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins atualizam configuracoes de pagamento" on public.payment_settings;
create policy "Admins atualizam configuracoes de pagamento" on public.payment_settings
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

revoke all on public.payment_settings from public, anon;
grant select, insert, update on public.payment_settings to authenticated;
grant all on public.payment_settings to service_role;

insert into public.payment_settings (provider)
values ('mercadopago')
on conflict (provider) do nothing;

commit;
