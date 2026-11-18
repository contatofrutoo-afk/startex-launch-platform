import { AtSign, Loader2, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { communityDisplayName, initials, type CommunityProfile } from "@/lib/community";

type Props = {
  me: CommunityProfile;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  replyTo: { id: string; authorName: string } | null;
  onCancelReply: () => void;
  mentions: CommunityProfile[];
  onRemoveMention: (id: string) => void;
  onOpenMentionPicker: () => void;
  disabled?: boolean;
};

export function CommunityComposer({
  me,
  value,
  onChange,
  onSubmit,
  submitting,
  replyTo,
  onCancelReply,
  mentions,
  onRemoveMention,
  onOpenMentionPicker,
  disabled,
}: Props) {
  const name = communityDisplayName(me);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      {replyTo && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Respondendo a{" "}
            <span className="font-semibold text-foreground">{replyTo.authorName}</span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded p-1 hover:bg-secondary"
            aria-label="Cancelar resposta"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {mentions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {mentions.map((profile) => (
            <span
              key={profile.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              <AtSign className="size-3" /> {communityDisplayName(profile)}
              <button
                type="button"
                onClick={() => onRemoveMention(profile.id)}
                className="ml-0.5 rounded p-0.5 hover:bg-primary/20"
                aria-label={`Remover menção a ${communityDisplayName(profile)}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Avatar className="hidden size-10 border border-border sm:flex">
          {me.avatar_url ? <AvatarImage src={me.avatar_url} alt={name} /> : null}
          <AvatarFallback>{initials(me.nome)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={
              replyTo
                ? `Responder a ${replyTo.authorName}...`
                : "Escreva um comentário para a comunidade..."
            }
            rows={3}
            maxLength={2000}
            disabled={disabled || submitting}
            className="resize-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenMentionPicker}
              disabled={disabled || submitting}
            >
              <AtSign className="size-4" /> Mencionar
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{value.length}/2000</span>
              <Button
                type="button"
                variant="hero"
                size="sm"
                onClick={onSubmit}
                disabled={disabled || submitting || (!value.trim() && mentions.length === 0)}
              >
                {submitting ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
                Comentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
