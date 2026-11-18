import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  communityDisplayName,
  initials,
  profileLocation,
  type CommunityProfile,
} from "@/lib/community";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  members: CommunityProfile[];
  emptyLabel: string;
  onSelect: (member: CommunityProfile) => void;
};

export function MemberPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  members,
  emptyLabel,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) => {
      const haystack = [member.nome, member.cidade, member.estado].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [members, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, cidade ou estado"
            className="pl-9"
            aria-label="Buscar membros"
          />
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <Users className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>
            </div>
          ) : (
            filtered.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  onSelect(member);
                  onOpenChange(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-secondary/60"
              >
                <Avatar className="size-10 border border-border">
                  {member.avatar_url ? (
                    <AvatarImage src={member.avatar_url} alt={communityDisplayName(member)} />
                  ) : null}
                  <AvatarFallback>{initials(member.nome)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {communityDisplayName(member)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" /> {profileLocation(member)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
