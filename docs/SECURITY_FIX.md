# Correção de segurança (RLS + storage)

Se o Lovable Security exibir findings como:

- **Exposed personal & sensitive data** (`profiles`/`subscriptions`)
- **A rule lets anyone download files in `capas`**

rode o script `docs/sql/security_fix.sql` no **SQL do Lovable Cloud**.

O script é idempotente e faz:

1. Restringe `profiles`, `subscriptions`, `user_roles` e `orders` ao próprio usuário ou admin.
2. Torna o bucket `capas` **privado** e remove a policy de leitura pública.
3. Converte URLs públicas antigas de capas para o caminho interno do bucket.
4. Mantém leitura de capas para usuários autenticados e escrita apenas para admins.

O app já foi ajustado para gerar **signed URLs** para capas/thumbnails (`src/lib/storage.ts`), então as imagens continuam funcionando após a correção.

> Importante: a migração `drizzle/migrations/0001_startex_parte2_3.sql` recria a policy pública de `capas`. Rode `docs/sql/security_fix.sql` **depois** que essa migração for aplicada no Lovable Cloud.
