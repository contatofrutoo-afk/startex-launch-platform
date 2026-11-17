-- Startex - Concede acesso de administrador ao e-mail do dono.
-- Rode este arquivo no SQL Editor do Lovable Cloud / Supabase.
-- Idempotente: pode ser executado mais de uma vez.

begin;

-- 1) Se a conta já existe, promove para admin.
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('phoyouagencia@gmail.com')
on conflict (user_id, role) do nothing;

-- 2) Garante que novos cadastros com o e-mail do dono já nasçam como admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, telefone, aceite_termos_em)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'nome', ''), 120),
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data->>'telefone', ''), 20),
    case when new.raw_user_meta_data->>'aceite_termos' = 'true' then now() else null end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case
      when lower(coalesce(new.email, '')) = lower('phoyouagencia@gmail.com')
        then 'admin'::public.app_role
      else 'member'::public.app_role
    end
  )
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

commit;

-- Conferência: deve listar o e-mail como admin.
select u.email, r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
where lower(u.email) = lower('phoyouagencia@gmail.com');
