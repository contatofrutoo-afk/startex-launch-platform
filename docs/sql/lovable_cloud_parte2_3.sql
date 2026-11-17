-- Startex - Parte 2/3 (cole no SQL do Lovable Cloud quando conectar)
-- Requer funções/tabelas da Parte 1: has_role(), has_active_access(), touch_updated_at()

begin;

-- ========== SESSIONS (Lives / Hot Seats) ==========
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('hot_seat', 'tira_duvidas', 'aula_especial')),
  starts_at timestamptz not null,
  description text not null default '',
  join_url text,
  replay_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.sessions to authenticated;
grant all on public.sessions to service_role;
alter table public.sessions enable row level security;

drop policy if exists "Assinantes veem sessões" on public.sessions;
create policy "Assinantes veem sessões" on public.sessions
  for select to authenticated
  using (public.has_active_access(auth.uid()));

drop policy if exists "Admins gerenciam sessões" on public.sessions;
create policy "Admins gerenciam sessões" on public.sessions
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop trigger if exists sessions_touch on public.sessions;
create trigger sessions_touch before update on public.sessions
  for each row execute function public.touch_updated_at();

-- ========== PRODUCTS (Loja) ==========
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  member_price_cents integer check (member_price_cents is null or member_price_cents >= 0),
  type text not null check (type in ('ebook_pdf', 'planilha_excel', 'apresentacao_ppt', 'ferramenta_html')),
  file_path text,
  cover_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

drop policy if exists "Cadastrados veem produtos ativos" on public.products;
create policy "Cadastrados veem produtos ativos" on public.products
  for select to authenticated
  using (active = true or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins gerenciam produtos" on public.products;
create policy "Admins gerenciam produtos" on public.products
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ========== ORDERS (Pedidos da loja) ==========
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled', 'refunded')),
  provider text,
  provider_session_id text,
  provider_payment_intent_id text,
  amount_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_product_idx on public.orders(product_id);

grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

drop policy if exists "Ver próprios pedidos" on public.orders;
create policy "Ver próprios pedidos" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Criar próprio pedido" on public.orders;
create policy "Criar próprio pedido" on public.orders
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Atualizar próprios pedidos pendentes" on public.orders;
create policy "Atualizar próprios pedidos pendentes" on public.orders
  for update to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins gerenciam pedidos" on public.orders;
create policy "Admins gerenciam pedidos" on public.orders
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ========== AJUSTES: admin lê todos perfis/assinaturas (painel) ==========
drop policy if exists "Admins leem perfis" on public.profiles;
create policy "Admins leem perfis" on public.profiles
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins leem assinaturas" on public.subscriptions;
create policy "Admins leem assinaturas" on public.subscriptions
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ========== STORAGE BUCKETS ==========
insert into storage.buckets (id, name, public)
values
  ('capas', 'capas', false),
  ('videos', 'videos', false),
  ('produtos', 'produtos', false)
on conflict (id) do update set public = excluded.public;

-- Capas: somente usuários autenticados leem, admin gerencia
drop policy if exists "Capas públicas leitura" on storage.objects;
drop policy if exists "Capas leitura autenticada" on storage.objects;
create policy "Capas leitura autenticada" on storage.objects
  for select to authenticated using (bucket_id = 'capas');
drop policy if exists "Capas admin escrita" on storage.objects;
create policy "Capas admin escrita" on storage.objects
  for all to authenticated
  using (bucket_id = 'capas' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'capas' and public.has_role(auth.uid(), 'admin'));

-- Vídeos: admin gerencia; assinantes/amostra leem
drop policy if exists "Videos admin" on storage.objects;
create policy "Videos admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'videos' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'videos' and public.has_role(auth.uid(), 'admin'));
drop policy if exists "Videos leitura assinantes" on storage.objects;
create policy "Videos leitura assinantes" on storage.objects
  for select to authenticated
  using (bucket_id = 'videos' and public.has_active_access(auth.uid()));

-- Produtos (arquivos): admin gerencia; comprador pago lê
drop policy if exists "Produtos admin" on storage.objects;
create policy "Produtos admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'produtos' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'produtos' and public.has_role(auth.uid(), 'admin'));
drop policy if exists "Produtos leitura comprador" on storage.objects;
create policy "Produtos leitura comprador" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'produtos' and (
      public.has_role(auth.uid(), 'admin')
      or exists (
        select 1 from public.orders o
        join public.products p on p.id = o.product_id
        where o.user_id = auth.uid()
          and o.status = 'paid'
          and p.file_path = storage.objects.name
      )
    )
  );

commit;

-- APÓS phoyouagencia@gmail.com criar conta (rodar 1x):
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'::public.app_role from auth.users where lower(email) = lower('phoyouagencia@gmail.com')
-- on conflict (user_id, role) do nothing;
-- insert into public.subscriptions (user_id, status, acesso_manual)
-- select id, 'active', true from auth.users where lower(email) = lower('phoyouagencia@gmail.com')
-- on conflict (user_id) do update set status = 'active', acesso_manual = true;
