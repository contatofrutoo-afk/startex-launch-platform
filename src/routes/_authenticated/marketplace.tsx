import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Crown, Plus, Search, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/app/AppShell";
import { SubscribeButton } from "@/components/app/SubscribeButton";
import { CreateServiceCardDialog } from "@/components/marketplace/CreateServiceCardDialog";
import { ServiceCardItem } from "@/components/marketplace/ServiceCardItem";
import { useMember } from "@/hooks/use-member";
import { useServiceCards } from "@/hooks/use-marketplace";
import type { ServiceCard } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace de serviços — Startex" },
      {
        name: "description",
        content: "Encontre serviços e produtos oferecidos pelas membros da Startex.",
      },
      { property: "og:title", content: "Marketplace de serviços — Startex" },
      {
        property: "og:description",
        content: "Conheça os negócios e serviços da comunidade Startex.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const { data: member, isLoading: memberLoading } = useMember();
  const { data: cards, isLoading: cardsLoading } = useServiceCards();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const allCards = useMemo(() => cards ?? [], [cards]);
  const myCard = allCards.find((card) => card.user_id === member?.userId) ?? null;
  const loading = memberLoading || cardsLoading;

  const visibleCards = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allCards;
    return allCards.filter((card: ServiceCard) =>
      [card.nome, card.servico, card.cidade, card.estado, card.descricao]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [allCards, query]);

  return (
    <PageContainer>
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#123a6b_0%,#0e2748_45%,#6d4b12_100%)] p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-12 -top-12 size-52 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 left-16 size-60 rounded-full bg-[#d4af37]/10" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            <Sparkles className="size-3.5" /> Marketplace Startex
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            Serviços e produtos da nossa comunidade
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
            Conheça o que cada membro oferece e faça parcerias com quem já faz parte da Startex.
            Cards em destaque são patrocinados.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Store className="size-4" /> {allCards.length} cards publicados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Crown className="size-4 text-[#f5d67b]" /> Destaques patrocinados
            </span>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, serviço ou cidade"
            aria-label="Buscar cards"
            className="pl-9"
          />
        </div>
        {member?.hasAccess ? (
          <Button type="button" variant="hero" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> {myCard ? "Editar meu card" : "Criar meu card"}
          </Button>
        ) : (
          <SubscribeButton />
        )}
      </div>

      {!memberLoading && member && !member.hasAccess && (
        <p className="mt-3 text-sm text-muted-foreground">
          Assine a plataforma para publicar seu card no marketplace.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-80 w-full rounded-2xl" />
          ))
        ) : visibleCards.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
            <Store className="mx-auto size-9 text-primary" />
            <p className="mt-3 font-semibold">
              {query ? "Nenhum card encontrado" : "Nenhum card publicado ainda"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {query
                ? "Tente outro termo de busca."
                : "Seja a primeira membro a apresentar seu serviço aqui."}
            </p>
          </div>
        ) : (
          visibleCards.map((card) => (
            <ServiceCardItem
              key={card.id}
              card={card}
              isMine={card.user_id === member?.userId}
              onEdit={() => setDialogOpen(true)}
            />
          ))
        )}
      </div>

      {member && (
        <CreateServiceCardDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          member={{
            userId: member.userId,
            nome: member.nome,
            cidade: member.cidade,
            estado: member.estado,
            telefone: member.telefone,
          }}
          existingCard={myCard}
        />
      )}
    </PageContainer>
  );
}
