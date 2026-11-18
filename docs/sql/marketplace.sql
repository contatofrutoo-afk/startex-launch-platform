-- Startex — Marketplace de serviços (cards dos membros + patrocínio)
-- Rode no SQL do Lovable Cloud/Supabase DEPOIS de docs/sql/security_fix.sql
-- (precisa de has_active_access e has_role). Funciona com ou sem community.sql.
-- É idempotente: pode ser executado mais de uma vez.

begin;

-- ========== 1. Cards ==========
create table if not exists public.service_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null default '',
  cidade text not null default '',
  estado text not null default '',
  servico text not null default '',
  descricao text not null default '',
  contato text not null default '',
  avatar_url text,
  patrocinado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_cards_nome_size check (char_length(nome) <= 120),
  constraint service_cards_servico_size check (char_length(servico) <= 120),
  constraint service_cards_descricao_size check (char_length(descricao) <= 600)
);

create index if not exists service_cards_patrocinado_idx
  on public.service_cards (patrocinado, created_at desc);

create or replace function public.touch_service_card()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists service_cards_touch on public.service_cards;
create trigger service_cards_touch
  before update on public.service_cards
  for each row execute function public.touch_service_card();

-- Somente admins podem patrocinar, e no máximo os 20 primeiros cards.
create or replace function public.guard_service_card_sponsor()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _sponsored integer;
begin
  if tg_op = 'INSERT' then
    if new.patrocinado then
      raise exception 'Somente administradores podem patrocinar cards.';
    end if;
    return new;
  end if;

  if new.patrocinado is distinct from old.patrocinado then
    if auth.uid() is not null and not public.has_role(auth.uid(), 'admin') then
      raise exception 'Somente administradores podem alterar o destaque.';
    end if;
    if new.patrocinado then
      select count(*) into _sponsored
      from public.service_cards
      where patrocinado = true and id <> new.id;
      if _sponsored >= 20 then
        raise exception 'Limite de 20 cards patrocinados atingido.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists service_cards_sponsor_guard on public.service_cards;
create trigger service_cards_sponsor_guard
  before insert or update on public.service_cards
  for each row execute function public.guard_service_card_sponsor();

-- ========== 2. View pública do marketplace ==========
-- Só aparecem cards de membros com assinatura ativa (ou admin/acesso manual).
create or replace view public.marketplace_cards as
select
  sc.id,
  sc.user_id,
  coalesce(nullif(sc.nome, ''), nullif(p.nome, ''), 'Membro Startex') as nome,
  coalesce(nullif(sc.cidade, ''), nullif(to_jsonb(p)->>'cidade', ''), '') as cidade,
  coalesce(nullif(sc.estado, ''), nullif(to_jsonb(p)->>'estado', ''), '') as estado,
  sc.servico,
  sc.descricao,
  sc.contato,
  coalesce(nullif(sc.avatar_url, ''), nullif(to_jsonb(p)->>'avatar_url', '')) as avatar_url,
  sc.patrocinado,
  sc.created_at
from public.service_cards sc
join public.profiles p on p.id = sc.user_id
where public.has_active_access(sc.user_id);

revoke all on public.marketplace_cards from public, anon;
grant select on public.marketplace_cards to authenticated, service_role;

-- ========== 3. RLS ==========
alter table public.service_cards enable row level security;

drop policy if exists "Ver cards do marketplace" on public.service_cards;
create policy "Ver cards do marketplace" on public.service_cards
  for select to authenticated using (true);

drop policy if exists "Membros assinantes criam seu card" on public.service_cards;
create policy "Membros assinantes criam seu card" on public.service_cards
  for insert to authenticated
  with check (auth.uid() = user_id and public.has_active_access(auth.uid()));

drop policy if exists "Membros editam seu card" on public.service_cards;
create policy "Membros editam seu card" on public.service_cards
  for update to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Membros excluem seu card" on public.service_cards;
create policy "Membros excluem seu card" on public.service_cards
  for delete to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- ========== 4. Permissões ==========
revoke all on public.service_cards from public, anon;
grant select, insert, update, delete on public.service_cards to authenticated;
grant all on public.service_cards to service_role;

revoke all on function public.guard_service_card_sponsor() from public;
grant execute on function public.guard_service_card_sponsor() to service_role;

-- ========== 5. Bucket de avatares (usado pela foto do card) ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatares leitura pública" on storage.objects;
create policy "Avatares leitura pública" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "Avatares envio pelo próprio membro" on storage.objects;
create policy "Avatares envio pelo próprio membro" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatares atualização pelo próprio membro" on storage.objects;
create policy "Avatares atualização pelo próprio membro" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
