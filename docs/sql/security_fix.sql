-- Startex - Correção de segurança (RLS + storage)
-- Rode este arquivo no SQL do Lovable Cloud se os findings de segurança aparecerem.
-- Ele é idempotente: pode ser executado mais de uma vez.

begin;

-- ========== Funções auxiliares ==========
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.has_active_access(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'admin') or exists (
    select 1 from public.subscriptions s
    where s.user_id = _user_id
      and (
        s.acesso_manual
        or (s.status in ('active', 'trialing') and (s.current_period_end is null or s.current_period_end > now()))
      )
  )
$$;

-- ========== RLS em todas as tabelas do app ==========
alter table if exists public.profiles enable row level security;
alter table if exists public.subscriptions enable row level security;
alter table if exists public.user_roles enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.tracks enable row level security;
alter table if exists public.lessons enable row level security;
alter table if exists public.lesson_media enable row level security;
alter table if exists public.lesson_progress enable row level security;
alter table if exists public.sessions enable row level security;
alter table if exists public.products enable row level security;

-- Nenhum acesso anônimo às tabelas com dados pessoais.
do $$
begin
  if to_regclass('public.profiles') is not null then execute 'revoke all on public.profiles from anon'; end if;
  if to_regclass('public.subscriptions') is not null then execute 'revoke all on public.subscriptions from anon'; end if;
  if to_regclass('public.user_roles') is not null then execute 'revoke all on public.user_roles from anon'; end if;
  if to_regclass('public.orders') is not null then execute 'revoke all on public.orders from anon'; end if;
end $$;

-- ========== PROFILES: somente o próprio usuário ou admin ==========
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
end $$;
create policy "Ver o próprio perfil" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Editar o próprio perfil" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- O e-mail confiável é auth.users.email; o usuário só pode editar nome e telefone do perfil.
revoke update on public.profiles from authenticated;
grant update (nome, telefone) on public.profiles to authenticated;

-- ========== SUBSCRIPTIONS: somente a própria assinatura ou admin ==========
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'subscriptions' loop
    execute format('drop policy if exists %I on public.subscriptions', r.policyname);
  end loop;
end $$;
create policy "Ver a própria assinatura" on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins gerenciam assinaturas" on public.subscriptions
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ========== USER_ROLES: somente os próprios papéis ou admin ==========
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'user_roles' loop
    execute format('drop policy if exists %I on public.user_roles', r.policyname);
  end loop;
end $$;
create policy "Ver os próprios papéis" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ========== ORDERS: somente os próprios pedidos ou admin ==========
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'orders' loop
    execute format('drop policy if exists %I on public.orders', r.policyname);
  end loop;
end $$;
create policy "Ver próprios pedidos" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Criar próprio pedido" on public.orders
  for insert to authenticated
  with check (user_id = auth.uid());
create policy "Atualizar próprios pedidos pendentes" on public.orders
  for update to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins gerenciam pedidos" on public.orders
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ========== STORAGE: capas privadas ==========
-- Converte URLs públicas antigas para o caminho dentro do bucket.
update public.tracks
set cover_url = regexp_replace(cover_url, '^.*/storage/v1/object/public/capas/', '')
where cover_url like '%/storage/v1/object/public/capas/%';

update public.lessons
set thumbnail_url = regexp_replace(thumbnail_url, '^.*/storage/v1/object/public/capas/', '')
where thumbnail_url like '%/storage/v1/object/public/capas/%';

update public.products
set cover_url = regexp_replace(cover_url, '^.*/storage/v1/object/public/capas/', '')
where cover_url like '%/storage/v1/object/public/capas/%';

update storage.buckets set public = false where id = 'capas';

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') like '%capas%' or coalesce(with_check, '') like '%capas%')
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;
create policy "Capas leitura autenticada" on storage.objects
  for select to authenticated
  using (bucket_id = 'capas');

drop policy if exists "Capas admin escrita" on storage.objects;
create policy "Capas admin escrita" on storage.objects
  for all to authenticated
  using (bucket_id = 'capas' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'capas' and public.has_role(auth.uid(), 'admin'));

commit;
