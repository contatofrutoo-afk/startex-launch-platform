import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { useMember } from "@/hooks/use-member";
import { PRODUCT_FILTERS, effectivePriceCents, productTypeLabel, type Product } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/loja")({
  head: () => ({
    meta: [
      { title: "Loja — Startex" },
      { name: "description", content: "Ebooks, planilhas, apresentações e ferramentas online para empreendedores." },
      { property: "og:title", content: "Loja — Startex" },
      { property: "og:description", content: "Ebooks, planilhas, apresentações e ferramentas online para empreendedores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LojaPage,
});

export function useProducts() {
  return useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

function LojaPage() {
  const products = useProducts();
  const member = useMember();
  const [filter, setFilter] = useState<(typeof PRODUCT_FILTERS)[number]["value"]>("todos");
  const [q, setQ] = useState("");
  const hasSub = member.data?.hasAccess ?? false;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products.data ?? []).filter((p) => {
      if (filter !== "todos" && p.type !== filter) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products.data, filter, q]);

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold sm:text-4xl">Loja</h1>
      <p className="mt-2 text-muted-foreground">
        Ebooks, planilhas, apresentações e ferramentas online. Qualquer pessoa cadastrada pode comprar; assinantes podem ter preço especial.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {PRODUCT_FILTERS.map((f) => (
            <Button key={f.value} size="sm" variant={filter === f.value ? "default" : "outline"} onClick={() => setFilter(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome" className="pl-9" />
        </div>
      </div>

      {products.isLoading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      )}
      {products.isError && (
        <div className="mt-8 rounded-xl border border-destructive/40 bg-card p-5 text-sm">
          Não foi possível carregar a loja.{" "}
          {String((products.error as any)?.message ?? "").includes("products")
            ? "A tabela de produtos ainda não foi criada no banco (solicite no Lovable)."
            : "Tente novamente."}
        </div>
      )}

      {products.data && filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-semibold">Nenhum produto encontrado</p>
          <p className="mt-1 text-muted-foreground">Tente outro filtro ou busca.</p>
        </div>
      )}

      {products.data && filtered.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const price = effectivePriceCents(p, hasSub);
            const promo = hasSub && typeof p.member_price_cents === "number" && p.member_price_cents < p.price_cents;
            return (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="aspect-[4/3] bg-surface-raised">
                  {p.cover_url ? (
                    <img src={p.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ShoppingBag className="size-10" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{productTypeLabel(p.type)}</p>
                  <h3 className="mt-1 font-semibold leading-snug">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold">{formatBRL(price)}</span>
                    {promo && <span className="text-sm text-muted-foreground line-through">{formatBRL(p.price_cents)}</span>}
                    {promo && <span className="text-xs font-semibold text-primary">Preço assinante</span>}
                  </div>
                  <Button asChild className="mt-4 w-full">
                    <Link to="/loja/$slug" params={{ slug: p.slug }}>
                      Ver produto
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
