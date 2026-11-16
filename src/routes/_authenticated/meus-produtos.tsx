import { useMemo, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, Package, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageContainer } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/hooks/use-member";
import { isDownloadableProduct, productTypeLabel, type Order } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/meus-produtos")({
  validateSearch: (s: Record<string, unknown>) => ({
    comprado: s["comprado"] === "1" || s["comprado"] === 1 ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Meus produtos — Startex" },
      { name: "description", content: "Seus ebooks, planilhas e ferramentas comprados na Startex." },
      { property: "og:title", content: "Meus produtos — Startex" },
      { property: "og:description", content: "Seus ebooks, planilhas e ferramentas comprados na Startex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeusProdutosPage,
});

function MeusProdutosPage() {
  const member = useMember();
  const search = useSearch({ from: "/_authenticated/meus-produtos" });
  const [tool, setTool] = useState<{ name: string; url: string } | null>(null);
  const ordersQ = useQuery({
    queryKey: ["my-orders", member.data?.userId],
    enabled: !!member.data?.userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("*, product:products(*)")
        .eq("user_id", member.data!.userId)
        .eq("status", "paid")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  async function baixar(filePath: string) {
    const { data, error } = await supabase.storage.from("produtos").createSignedUrl(filePath, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível gerar o link de download. Tente novamente.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function abrirFerramenta(filePath: string, name: string) {
    const { data, error } = await supabase.storage.from("produtos").createSignedUrl(filePath, 60 * 30);
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível abrir a ferramenta. Tente novamente.");
      return;
    }
    setTool({ name, url: data.signedUrl });
  }

  const items = useMemo(() => ordersQ.data ?? [], [ordersQ.data]);

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold sm:text-4xl">Meus produtos</h1>
      <p className="mt-2 text-muted-foreground">
        Seus ebooks, planilhas e ferramentas comprados. Links de arquivo são temporários e protegidos.
      </p>
      {search.comprado && (
        <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
          Compra recebida. Se o produto ainda não aparecer, aguarde a confirmação do pagamento.
        </div>
      )}

      {(member.isLoading || ordersQ.isLoading) && (
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      )}
      {ordersQ.isError && (
        <div className="mt-8 rounded-xl border border-destructive/40 bg-card p-5 text-sm">
          Não foi possível carregar seus produtos.{" "}
          {String((ordersQ.error as any)?.message ?? "").includes("orders")
            ? "A tabela de pedidos/produtos ainda não foi criada no banco (solicite no Lovable)."
            : "Tente novamente."}
        </div>
      )}

      {ordersQ.data && items.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <Package className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-semibold">Você ainda não comprou produtos</p>
          <p className="mt-1 text-muted-foreground">Visite a loja para ver ebooks, planilhas e ferramentas.</p>
          <Button asChild className="mt-4">
            <Link to="/loja">Ir para a loja</Link>
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 space-y-4">
          {items.map((o) => {
            const p = o.product as any;
            if (!p) return null;
            const downloadable = isDownloadableProduct(p.type);
            return (
              <article
                key={o.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="size-16 overflow-hidden rounded-lg bg-surface-raised">
                    {p.cover_url ? <img src={p.cover_url} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{productTypeLabel(p.type)}</p>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Comprado em {new Date(o.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div>
                  {downloadable ? (
                    <Button onClick={() => p.file_path && baixar(p.file_path)} disabled={!p.file_path}>
                      <Download className="size-4" /> Baixar
                    </Button>
                  ) : (
                    <Button onClick={() => p.file_path && abrirFerramenta(p.file_path, p.name)} disabled={!p.file_path}>
                      <ExternalLink className="size-4" /> Abrir ferramenta
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={!!tool} onOpenChange={(v) => !v && setTool(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{tool?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldAlert className="size-3" /> Ferramenta aberta em sandbox isolado (iframe).
          </div>
          {tool && (
            <iframe
              title={tool.name}
              src={tool.url}
              sandbox="allow-scripts allow-forms allow-downloads"
              className="mt-2 h-[70vh] w-full rounded-lg border border-border bg-white"
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
