-- Diagnóstico de RLS e policies (somente leitura)
-- Rode no SQL do Lovable Cloud e confira se todas as tabelas do app têm rowsecurity = true.

-- 1) Tabelas públicas com RLS desligado (deve vir vazio).
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and rowsecurity = false
order by tablename;

-- 2) Policies das tabelas com dados pessoais.
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'subscriptions', 'user_roles', 'orders')
order by tablename, cmd, policyname;

-- 3) Quem tem SELECT nas tabelas sensíveis.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles', 'subscriptions', 'user_roles', 'orders')
  and privilege_type = 'SELECT'
order by table_name, grantee;
