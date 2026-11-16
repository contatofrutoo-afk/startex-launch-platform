# Lovable / Supabase setup (itens gerenciados fora do repo)

Este projeto está conectado ao Lovable: **não edite `supabase/migrations/` nem `drizzle/` manualmente** e não coloque segredos no repo. Peça ao Lovable (ou use o editor/MCP) para aplicar o que segue.

## 1) Conta administradora
- **E-mail do dono:** `phoyouagencia@gmail.com` — definir essa conta como `admin` em `user_roles` (role `admin`) no Lovable Cloud.
- (Opcional) liberar acesso manual em `subscriptions` (`acesso_manual=true`, `status='active'`).

## 2) Banco de dados (faltante para PARTE 2/3)
**SQL pronto para colar:** `docs/sql/lovable_cloud_parte2_3.sql` (rodar no SQL do Lovable Cloud quando conectar). Cria tabelas/RLS/políticas abaixo, buckets e políticas de storage:

### `sessions` (lives/hot seats)
- `id uuid pk default gen_random_uuid()`, `title text`, `type text check in ('hot_seat','tira_duvidas','aula_especial')`, `starts_at timestamptz`, `description text`, `join_url text`, `replay_url text`, `created_at timestamptz default now()`
- RLS: SELECT para assinantes ativos/admin (`has_active_access(auth.uid())`); INSERT/UPDATE/DELETE só admin. Conteúdo/links de acesso só para assinantes ativos ou admins.

### `products`
- `id uuid pk default gen_random_uuid()`, `slug text unique`, `name text`, `description text`, `price_cents int`, `member_price_cents int null`, `type text check in ('ebook_pdf','planilha_excel','apresentacao_ppt','ferramenta_html')`, `file_path text`, `cover_url text`, `active bool default true`, `created_at timestamptz default now()`
- RLS: SELECT para authenticated quando `active=true` (loja para cadastrados); escrita só admin.

### `orders`
- `id uuid pk default gen_random_uuid()`, `user_id uuid`, `product_id uuid ref products`, `status text check in ('pending','paid','canceled','refunded')`, `provider text`, `provider_session_id text`, `provider_payment_intent_id text`, `amount_cents int`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`
- RLS: SELECT do próprio usuário (`user_id=auth.uid()`) ou admin; INSERT pelo próprio usuário (pending) permitido; UPDATE de status via service_role/webhook.

### Ajustes recomendados
- `profiles`/`subscriptions`: admins podem SELECT todos e gerenciar assinaturas (painel de alunos/vendas).

## 3) Storage buckets
- `capas` **público** (thumbnails/capas).
- `videos` **privado** (aulas) — signed URL para quem tem acesso.
- `produtos` **privado** (PDF/XLSX/PPTX/HTML) — signed URL para compradores com pedido `paid` ou admins.

## 4) Autenticação (Lovable Cloud)
- **Obrigatório:** desativar confirmação de e-mail no cadastro (Supabase Auth no Lovable Cloud) para o aluno ir direto às trilhas (`/trilhas`) após criar a conta.
- O app redireciona para `/trilhas` quando a sessão é criada no cadastro; se o Auth ainda exigir confirmação, a sessão não será criada e o acesso direto não ocorrerá até desativar essa verificação.

## 5) Pagamentos (Stripe, modo teste) — segredos
Configurar em Lovable Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SUBSCRIPTION_297` (R$297/mês BRL). Opcional front: `VITE_STRIPE_PUBLISHABLE_KEY`.
- Webhooks atualizam `subscriptions` e liberam `orders` (`paid`). Portal do cliente para cancelar/atualizar cartão.
- Arquitetura pronta para trocar/adicionar Pix (`src/lib/payments/`, `supabase/functions/`).

## 6) Edge Functions (stubs no repo)
`supabase/functions/create-checkout`, `stripe-webhook`, `customer-portal` são stubs — implantar/configurar no Lovable com segredos acima.

> Sem essas criações no Lovable, as telas novas exibem mensagens claras de indisponibilidade; Parte 1 segue funcional.
