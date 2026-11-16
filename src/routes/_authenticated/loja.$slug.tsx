import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Lock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { useMember } from "@/hooks/use-member";
import { effectivePriceCents, isDownloadableProduct, productTypeLabel, type Product } from "@/lib/products";
import { getPaymentAdapter } from "@/lib/payments";

export const Route = createFileRoute("/_authenticated/loja/$slug")({
  head: () => ({
    meta: [{ title: "Produto — Startex" }, { name: "description", content: "Detalhes do produto na loja Startex." }],
  }),
  component: ProdutoPage,
});

function ProdutoPage() {
  const { slug } = Route.useParams();
  const member = useMember();
  const [buying, setBuying] = useState(false);
  const q = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });
  const ownedQ = useQuery({
    queryKey: ["order-owned", slug, member.data?.userId],
    enabled: !!member.data?.userId && !!q.data?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("orders")
        .select("id,status")
        .eq("user_id", member.data!.userId)
        .eq("product_id", q.data!.id)
        .eq("status", "paid")
        .maybeSingle();
      return !!data;
    },
  });

  async function buy() {
    if (!q.data) return;
    setBuying(true);
    try {
      const adapter = getPaymentAdapter();
      const res = await adapter.createCheckout({
        kind: "product",
        productId: q.data.id,
        successUrl: `${window.location.origin}/meus-produtos?comprado=1`,
        cancelUrl: `${window.location.origin}/loja/${q.data.slug}`,
      });
      if ("unavailable" in res) {
        toast.info(res.message);
        // fallback: registra intenção pendente para tratamento manual, se a tabela existir
        await (supabase as any)
          .from("orders")
          .insert({
            user_id: member.data?.userId,
            product_id: q.data.id,
            status: "pending",
            provider: "manual",
            amount_cents: effectivePriceCents(q.data, member.data?.hasAccess ?? false),
          })
          .then(() => {});
      } else {
        window.location.href = res.url;
      }
    } catch {
      toast.error("Não foi possível iniciar a compra. Tente novamente.");
    } finally {
      setBuying(false);
    }
  }

  if (q.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-80 w-full max-w-3xl" />
      </PageContainer>
    );
  }
  if (q.isError || !q.data) {
    return (
      <PageContainer>
        <p className="font-display text-xl font-semibold">Produto não encontrado</p>
        <Button asChild className="mt-4">
          <Link to="/loja">Voltar para a loja</Link>
        </Button>
      </PageContainer>
    );
  }

  const p = q.data;
  const hasSub = member.data?.hasAccess ?? false;
  const price = effectivePriceCents(p, hasSub);
  const promo = hasSub && typeof p.member_price_cents === "number" && p.member_price_cents < p.price_cents;
  const owned = ownedQ.data === true;

  return (
    <PageContainer>
      <Link to="/loja" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Loja
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-surface-raised">
            {p.cover_url ? (
              <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ShoppingCart className="size-12" />
              </div>
            )}
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-primary">{productTypeLabel(p.type)}</p>
          <h1 className="mt-1 text-3xl font-bold">{p.name}</h1>
          {p.description && (
            <div className="prose prose-invert mt-4 max-w-none whitespace-pre-line text-muted-foreground">{p.description}</div>
          )}
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{formatBRL(price)}</span>
            {promo && <span className="text-muted-foreground line-through">{formatBRL(p.price_cents)}</span>}
          </div>
          {promo && <p className="mt-1 text-sm font-medium text-primary">Preço especial para assinantes</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            {isDownloadableProduct(p.type)
              ? "Entrega: arquivo para download após a compra."
              : "Entrega: acesso à ferramenta online dentro da plataforma."}
          </p>
          {owned ? (
            <Button asChild className="mt-6 w-full" variant="hero">
              <Link to="/meus-produtos" search={{ comprado: false }}>
                Abrir em Meus produtos <ExternalLink className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button className="mt-6 w-full" variant="hero" onClick={buy} disabled={buying || !member.data}>
              <ShoppingCart className="size-4" /> {buying ? "Iniciando..." : "Comprar"}
            </Button>
          )}
          {!member.data && (
            <p className="mt-2 text-xs text-muted-foreground">
              <Lock className="mr-1 inline size-3" />
              Faça login/cadastro para comprar.
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Pagamentos via Stripe (modo de teste) quando configurado. A arquitetura permite trocar/adicionar Pix depois.
          </p>
        </aside>
      </div>
    </PageContainer>
  );
}
