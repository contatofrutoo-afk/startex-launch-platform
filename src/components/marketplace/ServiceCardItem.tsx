import { Crown, MapPin, MessageCircle, Pencil, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cardLocation, contactDigits, type ServiceCard } from "@/lib/marketplace";
import { initials } from "@/lib/community";
import { cn } from "@/lib/utils";

type Props = {
  card: ServiceCard;
  isMine?: boolean;
  onEdit?: () => void;
};

export function ServiceCardItem({ card, isMine = false, onEdit }: Props) {
  const digits = contactDigits(card.contato);

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl bg-card p-5 shadow-card transition-transform",
        card.patrocinado
          ? "border-2 border-[#d4af37] shadow-[0_0_0_1px_rgba(212,175,55,0.25),0_16px_45px_-20px_rgba(212,175,55,0.6)]"
          : "border border-border hover:-translate-y-0.5",
      )}
    >
      {card.patrocinado && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-[#d4af37] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#241c05]">
          <Crown className="mr-1 inline size-3" /> Destaque
        </div>
      )}

      <div className="flex items-start gap-3">
        <Avatar className="size-14 shrink-0 border-2 border-primary/20">
          {card.avatar_url ? <AvatarImage src={card.avatar_url} alt={card.nome} /> : null}
          <AvatarFallback>{initials(card.nome)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 pt-0.5">
          <h3 className="truncate font-display text-base font-bold leading-tight">{card.nome}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" /> {cardLocation(card)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Badge variant="secondary" className="max-w-full truncate text-primary">
          {card.servico}
        </Badge>
        <p className="mt-3 line-clamp-4 min-h-18 text-sm leading-relaxed text-muted-foreground">
          {card.descricao}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        {digits && (
          <Button asChild size="sm" variant="hero" className="flex-1">
            <a href={`https://wa.me/55${digits}`} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <a href={`tel:${digits}`}>
            <Phone className="size-4" /> Ligar
          </a>
        </Button>
        {isMine && onEdit && (
          <Button type="button" size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="size-4" /> Editar
          </Button>
        )}
      </div>
    </article>
  );
}
