begin;

alter table public.payment_settings add column if not exists subscription_price_cents integer not null default 29700 check (subscription_price_cents >= 0);

alter table public.products add column if not exists mercadopago_preference_id text;
alter table public.products add column if not exists mercadopago_member_preference_id text;
alter table public.products add column if not exists mercadopago_synced_at timestamptz;

create or replace function public.get_public_subscription_price()
returns table (price_cents integer, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select subscription_price_cents, updated_at
  from public.payment_settings
  where provider = 'mercadopago' and enabled
$$;

revoke all on function public.get_public_subscription_price() from public;
grant execute on function public.get_public_subscription_price() to anon, authenticated;

commit;
