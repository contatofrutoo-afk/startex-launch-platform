# Correção de segurança (RLS + storage)

Se o Lovable Security exibir findings como:

- **Exposed personal & sensitive data** (`profiles`/`subscriptions`)
- **A rule lets anyone download files in `capas`**

rode o script `docs/sql/security_fix.sql` no **SQL do Lovable Cloud**.

O script é idempotente e faz:

1. Ativa **RLS em todas as tabelas do app** (incluindo `profiles`, `subscriptions`, `user_roles`, `orders`, `tracks`, `lessons`, `sessions`, `products`).
2. Remove qualquer acesso do papel `anon` às tabelas com dados pessoais.
3. Restringe `profiles`, `subscriptions`, `user_roles` e `orders` ao próprio usuário ou admin.
4. Torna o bucket `capas` **privado** e remove a policy de leitura pública.
5. Converte URLs públicas antigas de capas para o caminho interno do bucket.
6. Mantém leitura de capas para usuários autenticados e escrita apenas para admins.

Para conferir depois de rodar, execute `docs/sql/security_diagnose.sql`: a primeira consulta deve voltar **vazia** (nenhuma tabela com `rowsecurity = false`).

## Verificação realizada

Após rodar o script no Lovable Cloud, as tabelas `profiles`, `subscriptions`, `user_roles` e `orders` passaram a responder **401 (permission denied)** para o papel `anon`, confirmando que o acesso anônimo foi removido.

Se o finding continuar no Lovable, clique nele e confira se aponta para o **código do painel admin** (ex.: `src/routes/_authenticated/admin.tsx`) em vez do banco. Nesse caso o próximo passo é mover a leitura de `email`/`telefone` para uma server function com checagem de admin.

O app já foi ajustado para gerar **signed URLs** para capas/thumbnails (`src/lib/storage.ts`), então as imagens continuam funcionando após a correção.

> Importante: a migração `drizzle/migrations/0001_startex_parte2_3.sql` recria a policy pública de `capas`. Rode `docs/sql/security_fix.sql` **depois** que essa migração for aplicada no Lovable Cloud.
