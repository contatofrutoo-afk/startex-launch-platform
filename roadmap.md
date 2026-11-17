# Startex — roadmap

## Parte 1 — Página de vendas, cadastro, login e trilhas
- [x] Página de vendas (/), cadastro (/cadastro), login (/entrar), recuperação de senha
- [x] Trilhas estilo Netflix (/trilhas) e página da aula (/aula/:id)
- [x] Minha conta, Termos e Privacidade
- [x] Conta administradora definida no app: `phoyouagencia@gmail.com` (fallback admin/acesso; aplicar role `admin` no Lovable Cloud)
- [x] Fluxo de cadastro sem verificação no app (redireciona às trilhas quando há sessão; desativar confirmação de e-mail no Auth do Lovable Cloud)

## Parte 2 — Lives, Hot Seats e Loja
- [x] Agenda /lives (próximas/anteriores, tipos, entrar/replay, gate de acesso)
- [x] Loja /loja, página do produto /loja/:slug, Meus produtos (download/ferramenta em sandbox)

## Parte 3 — Admin, pagamentos e segurança
- [x] Painel /admin (aulas/trilhas, lives, loja, alunos/CSV/liberar-revogar, vendas)
- [x] Pagamentos: arquitetura Stripe modo teste (checkout, webhooks, portal) + stubs de funções; pronto para Pix/outro provedor
- [x] Definições de storage/segurança no código e docs (buckets capas público, vídeos/produtos privados)

**Lovable Cloud (feito em 17/11/2026):** schema/RLS de `sessions`, `products`, `orders` aplicado; buckets `capas` (privado — público é bloqueado na plataforma), `videos` e `produtos` criados; login por e-mail ativado e confirmação de e-mail desativada; cadastro testado de ponta a ponta (conta → trilhas → aula).

**Ainda pendente:** atribuir role `admin` a `phoyouagencia@gmail.com` depois que o dono criar a conta; configurar segredos Stripe e implantar pagamentos; capas usam URL assinada (bucket privado).
