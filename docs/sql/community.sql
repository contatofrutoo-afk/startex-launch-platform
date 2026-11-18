-- Startex — Comunidade (fóruns, conversas privadas, curtidas e avatares)
-- Rode este arquivo no SQL do Lovable Cloud/Supabase DEPOIS de docs/sql/security_fix.sql.
-- É idempotente: pode ser executado mais de uma vez.

begin;

-- ========== 1. Perfil público da comunidade ==========
alter table public.profiles add column if not exists avatar_url text not null default '';
alter table public.profiles add column if not exists cidade text not null default '';
alter table public.profiles add column if not exists estado text not null default '';

-- Menor privilégio: o membro continua editando só os próprios dados do perfil.
revoke update on public.profiles from authenticated;
grant update (nome, telefone, avatar_url, cidade, estado) on public.profiles to authenticated;

-- A view expõe SOMENTE dados públicos da comunidade (nunca e-mail ou telefone).
-- Ela não usa security_invoker de propósito: o RLS de profiles segue protegendo
-- os dados sensíveis, enquanto o nome/foto/localização ficam visíveis aos membros.
create or replace view public.community_profiles as
select
  p.id,
  coalesce(p.nome, '') as nome,
  nullif(p.avatar_url, '') as avatar_url,
  coalesce(p.cidade, '') as cidade,
  coalesce(p.estado, '') as estado
from public.profiles p;

revoke all on public.community_profiles from public;
revoke all on public.community_profiles from anon;
grant select on public.community_profiles to authenticated;
grant select on public.community_profiles to service_role;

-- ========== 2. Tabelas da comunidade ==========
create table if not exists public.community_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  is_private boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_thread_members (
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.community_messages(id) on delete cascade,
  content text not null default '',
  mentioned_user_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  constraint community_messages_content_size check (char_length(content) <= 2000),
  constraint community_messages_not_empty check (
    char_length(btrim(content)) > 0 or cardinality(mentioned_user_ids) > 0
  ),
  constraint community_messages_mentions_limit check (cardinality(mentioned_user_ids) <= 50)
);

create table if not exists public.community_message_likes (
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists community_threads_private_idx
  on public.community_threads (is_private, created_at);
create index if not exists community_thread_members_user_idx
  on public.community_thread_members (user_id);
create index if not exists community_messages_thread_idx
  on public.community_messages (thread_id, created_at);
create index if not exists community_messages_parent_idx
  on public.community_messages (parent_id);
create index if not exists community_message_likes_message_idx
  on public.community_message_likes (message_id);

-- Mantém a data de atualização dos fóruns em dia.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_threads_touch on public.community_threads;
create trigger community_threads_touch
  before update on public.community_threads
  for each row execute function public.touch_updated_at();

create or replace function public.touch_community_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.community_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists community_messages_touch_thread on public.community_messages;
create trigger community_messages_touch_thread
  after insert on public.community_messages
  for each row execute function public.touch_community_thread();

-- ========== 3. Funções auxiliares de acesso ==========
create or replace function public.is_community_thread_member(_thread_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _user_id is not null and exists (
    select 1
    from public.community_thread_members
    where thread_id = _thread_id and user_id = _user_id
  )
$$;

create or replace function public.can_access_community_thread(_thread_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _user_id is not null and exists (
    select 1
    from public.community_threads t
    where t.id = _thread_id
      and (
        not t.is_private
        or exists (
          select 1
          from public.community_thread_members m
          where m.thread_id = t.id and m.user_id = _user_id
        )
      )
  )
$$;

create or replace function public.can_access_community_message(_message_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _user_id is not null and exists (
    select 1
    from public.community_messages msg
    join public.community_threads t on t.id = msg.thread_id
    where msg.id = _message_id
      and (
        not t.is_private
        or exists (
          select 1
          from public.community_thread_members m
          where m.thread_id = t.id and m.user_id = _user_id
        )
      )
  )
$$;

create or replace function public.message_belongs_to_thread(_message_id uuid, _thread_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.community_messages
    where id = _message_id and thread_id = _thread_id
  )
$$;

revoke all on function public.is_community_thread_member(uuid, uuid) from public;
revoke all on function public.can_access_community_thread(uuid, uuid) from public;
revoke all on function public.can_access_community_message(uuid, uuid) from public;
revoke all on function public.message_belongs_to_thread(uuid, uuid) from public;
grant execute on function public.is_community_thread_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_access_community_thread(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_access_community_message(uuid, uuid) to authenticated, service_role;
grant execute on function public.message_belongs_to_thread(uuid, uuid) to authenticated, service_role;

-- ========== 4. RLS ==========
alter table public.community_threads enable row level security;
alter table public.community_thread_members enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_message_likes enable row level security;

drop policy if exists "Ver fóruns e conversas permitidas" on public.community_threads;
create policy "Ver fóruns e conversas permitidas" on public.community_threads
  for select to authenticated
  using (not is_private or public.is_community_thread_member(id, auth.uid()));

drop policy if exists "Admins criam fóruns" on public.community_threads;
create policy "Admins criam fóruns" on public.community_threads
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins editam fóruns" on public.community_threads;
create policy "Admins editam fóruns" on public.community_threads
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins excluem fóruns" on public.community_threads;
create policy "Admins excluem fóruns" on public.community_threads
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Ver membros das conversas permitidas" on public.community_thread_members;
create policy "Ver membros das conversas permitidas" on public.community_thread_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_community_thread_member(thread_id, auth.uid())
  );

drop policy if exists "Ver mensagens permitidas" on public.community_messages;
create policy "Ver mensagens permitidas" on public.community_messages
  for select to authenticated
  using (public.can_access_community_thread(thread_id, auth.uid()));

drop policy if exists "Comentar em conversas permitidas" on public.community_messages;
create policy "Comentar em conversas permitidas" on public.community_messages
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_community_thread(thread_id, auth.uid())
    and (parent_id is null or public.message_belongs_to_thread(parent_id, thread_id))
  );

drop policy if exists "Excluir próprias mensagens ou moderar" on public.community_messages;
create policy "Excluir próprias mensagens ou moderar" on public.community_messages
  for delete to authenticated
  using (
    user_id = auth.uid()
    or (
      public.has_role(auth.uid(), 'admin')
      and public.can_access_community_thread(thread_id, auth.uid())
    )
  );

drop policy if exists "Ver curtidas permitidas" on public.community_message_likes;
create policy "Ver curtidas permitidas" on public.community_message_likes
  for select to authenticated
  using (public.can_access_community_message(message_id, auth.uid()));

drop policy if exists "Curtir mensagens permitidas" on public.community_message_likes;
create policy "Curtir mensagens permitidas" on public.community_message_likes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_community_message(message_id, auth.uid())
  );

drop policy if exists "Remover a própria curtida" on public.community_message_likes;
create policy "Remover a própria curtida" on public.community_message_likes
  for delete to authenticated
  using (user_id = auth.uid());

-- ========== 5. Permissões ==========
revoke all on public.community_threads from public, anon;
revoke all on public.community_thread_members from public, anon;
revoke all on public.community_messages from public, anon;
revoke all on public.community_message_likes from public, anon;

grant select, insert, update, delete on public.community_threads to authenticated;
grant select on public.community_thread_members to authenticated;
grant select, insert, delete on public.community_messages to authenticated;
grant select, insert, delete on public.community_message_likes to authenticated;

grant all on public.community_threads to service_role;
grant all on public.community_thread_members to service_role;
grant all on public.community_messages to service_role;
grant all on public.community_message_likes to service_role;

-- ========== 6. Conversa privada (cria ou devolve a existente) ==========
create or replace function public.get_or_create_private_thread(_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _me uuid := auth.uid();
  _existing uuid;
  _thread uuid;
begin
  if _me is null then
    raise exception 'Sessão obrigatória.';
  end if;
  if _other_user is null or _other_user = _me then
    raise exception 'Escolha outro membro para a conversa.';
  end if;
  if not exists (select 1 from public.profiles where id = _other_user) then
    raise exception 'Membro não encontrado.';
  end if;

  -- Serializa chamadas simultâneas do mesmo par.
  perform pg_advisory_xact_lock(
    hashtext(least(_me::text, _other_user::text) || ':' || greatest(_me::text, _other_user::text))
  );

  select t.id into _existing
  from public.community_threads t
  join public.community_thread_members m1 on m1.thread_id = t.id and m1.user_id = _me
  join public.community_thread_members m2 on m2.thread_id = t.id and m2.user_id = _other_user
  where t.is_private = true
    and (select count(*) from public.community_thread_members cm where cm.thread_id = t.id) = 2
  limit 1;

  if _existing is not null then
    return _existing;
  end if;

  insert into public.community_threads (title, description, is_private, created_by)
  values ('Conversa privada', '', true, _me)
  returning id into _thread;

  insert into public.community_thread_members (thread_id, user_id)
  values (_thread, _me), (_thread, _other_user);

  return _thread;
end;
$$;

revoke all on function public.get_or_create_private_thread(uuid) from public;
grant execute on function public.get_or_create_private_thread(uuid) to authenticated, service_role;

-- ========== 7. Fóruns gerais iniciais ==========
insert into public.community_threads (id, title, description, is_private, created_at)
values
  (
    'f2000000-0000-4000-8000-000000000001',
    'Mural de boas-vindas',
    'Apresente-se para a comunidade e conheça outros empreendedore(as).',
    false,
    now() - interval '4 days'
  ),
  (
    'f2000000-0000-4000-8000-000000000002',
    'Dúvidas e desafios do negócio',
    'Compartilhe seus desafios e ajude outros membros com soluções práticas.',
    false,
    now() - interval '3 days'
  ),
  (
    'f2000000-0000-4000-8000-000000000003',
    'Parcerias e indicações',
    'Encontre parceire(as), fornecedore(as) e clientes para o seu negócio.',
    false,
    now() - interval '2 days'
  ),
  (
    'f2000000-0000-4000-8000-000000000004',
    'Conquistas e novidades',
    'Celebre suas vitórias e acompanhe as novidades da Startex.',
    false,
    now() - interval '1 day'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description;

-- ========== 8. Bucket de avatares ==========
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

drop policy if exists "Avatares exclusão pelo próprio membro" on storage.objects;
create policy "Avatares exclusão pelo próprio membro" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
