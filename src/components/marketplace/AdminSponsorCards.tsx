import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAdminServiceCards } from "@/hooks/use-marketplace";
import { initials } from "@/lib/community";
import {
  MAX_SPONSORED_CARDS,
  adminServiceCardsKey,
  marketplaceCardsKey,
  setCardSponsored,
  type ServiceCard,
} from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export function AdminSponsorCards() {
  const queryClient = useQueryClient();
  const { data: cards, isLoading } = useAdminServiceCards(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const list = cards ?? [];
  const sponsoredCount = list.filter((card) => card.patrocinado).length;
  const atLimit = sponsoredCount >= MAX_SPONSORED_CARDS;

  async function toggle(card: ServiceCard) {
    setPendingId(card.id);
    try {
      await setCardSponsored(card.id, !card.patrocinado);
      toast.success(
        card.patrocinado ? "Destaque removido do card." : "Card patrocinado em destaque.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminServiceCardsKey }),
        queryClient.invalidateQueries({ queryKey: marketplaceCardsKey }),
      ]);
    } catch {
      toast.error("Não foi possível atualizar o destaque.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Crown className="size-5 text-[#d4af37]" /> Patrocinar cards
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Os primeiros {MAX_SPONSORED_CARDS} cards patrocinados aparecem no topo do marketplace
            com contorno dourado e selo de destaque.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/marketplace">
            Ver marketplace <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-5 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#f5d67b]">
            {sponsoredCount} de {MAX_SPONSORED_CARDS} vagas em destaque
          </span>
          <span className="text-muted-foreground">
            {atLimit ? "Limite atingido" : `${MAX_SPONSORED_CARDS - sponsoredCount} vagas livres`}
          </span>
        </div>
        <Progress
          value={(sponsoredCount / MAX_SPONSORED_CARDS) * 100}
          className="mt-3 h-2 [&>div]:bg-[#d4af37]"
        />
      </div>

      <div className="mt-5 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Nenhum card criado ainda. Assim que uma membro publicar seu card, ele aparece aqui.
          </div>
        ) : (
          list.map((card) => (
            <div
              key={card.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                card.patrocinado
                  ? "border-[#d4af37] bg-[#d4af37]/5"
                  : "border-border hover:bg-secondary/40",
              )}
            >
              <Avatar className="size-10 shrink-0 border border-border">
                {card.avatar_url ? <AvatarImage src={card.avatar_url} alt={card.nome} /> : null}
                <AvatarFallback>{initials(card.nome)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {card.nome}
                  {card.patrocinado && (
                    <span className="ml-2 rounded-full bg-[#d4af37]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#f5d67b]">
                      Patrocinado
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {card.servico} {card.cidade ? `— ${card.cidade}` : ""}
                </p>
              </div>
              {pendingId === card.id ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <Switch
                  checked={card.patrocinado}
                  disabled={atLimit && !card.patrocinado}
                  onCheckedChange={() => void toggle(card)}
                  aria-label={`Patrocinar card de ${card.nome}`}
                />
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
