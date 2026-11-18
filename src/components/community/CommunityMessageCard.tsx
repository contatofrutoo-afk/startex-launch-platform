import { AtSign, Heart, MapPin, Reply, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDateTimeSP } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  communityDisplayName,
  initials,
  profileLocation,
  type CommunityMessageView,
  type CommunityProfile,
} from "@/lib/community";

type Props = {
  message: CommunityMessageView;
  currentUserId: string;
  isAdmin: boolean;
  depth?: number;
  isLikeLoading: (messageId: string) => boolean;
  onToggleLike: (message: CommunityMessageView) => void;
  onReply: (message: CommunityMessageView) => void;
  onMention: (profile: CommunityProfile) => void;
  onDelete: (message: CommunityMessageView) => void;
};

export function CommunityMessageCard({
  message,
  currentUserId,
  isAdmin,
  depth = 0,
  isLikeLoading,
  onToggleLike,
  onReply,
  onMention,
  onDelete,
}: Props) {
  const author = message.author;
  const authorName = communityDisplayName(author);
  const authorAvatar = author?.avatar_url ?? null;
  const canDelete = message.user_id === currentUserId || isAdmin;
  const loading = isLikeLoading(message.id);
  const root = depth === 0;
  const hasLocation = Boolean(author && (author.cidade.trim() || author.estado.trim()));

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm",
        !root && "rounded-xl border-border/70 bg-muted/20 p-3 shadow-none",
      )}
    >
      <div className="flex gap-3">
        <Avatar className={cn("border border-border", root ? "size-10" : "size-8")}>
          {authorAvatar ? <AvatarImage src={authorAvatar} alt={authorName} /> : null}
          <AvatarFallback className={cn("font-semibold", root ? "text-sm" : "text-xs")}>
            {initials(author?.nome ?? authorName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold">{authorName}</span>
            {hasLocation && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="size-3" /> {profileLocation(author)}
              </span>
            )}
            <time
              dateTime={message.created_at}
              className="ml-auto text-[11px] text-muted-foreground"
              title={formatDateTimeSP(message.created_at)}
            >
              {formatDateTimeSP(message.created_at)}
            </time>
          </div>

          {message.content.trim() && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.content}
            </p>
          )}

          {message.mentionedProfiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.mentionedProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onMention(profile)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                  title={`Mencionar ${communityDisplayName(profile)} de novo`}
                >
                  <AtSign className="size-3" /> {communityDisplayName(profile)}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggleLike(message)}
              disabled={loading}
              aria-pressed={message.likedByMe}
              aria-label={message.likedByMe ? "Descurtir" : "Curtir"}
              className={cn(
                "h-8 gap-1.5 px-2 text-xs",
                message.likedByMe && "text-rose-400 hover:text-rose-300",
              )}
            >
              <Heart className={cn("size-4", message.likedByMe && "fill-current")} />
              {message.likeCount > 0 ? message.likeCount : "Curtir"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onReply(message)}
              className="h-8 gap-1.5 px-2 text-xs"
            >
              <Reply className="size-4" /> Responder
            </Button>
            {author && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onMention(author)}
                className="h-8 gap-1.5 px-2 text-xs"
              >
                <AtSign className="size-4" /> Mencionar
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(message)}
                className="ml-auto h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
                aria-label="Excluir comentário"
              >
                <Trash2 className="size-4" /> Excluir
              </Button>
            )}
          </div>
        </div>
      </div>

      {message.replies.length > 0 && (
        <div
          className={cn(
            "mt-3 space-y-2 border-l-2 pl-3 sm:pl-4",
            root ? "border-primary/20" : "border-primary/10",
          )}
        >
          {message.replies.map((reply) => (
            <CommunityMessageCard
              key={reply.id}
              message={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              depth={depth + 1}
              isLikeLoading={isLikeLoading}
              onToggleLike={onToggleLike}
              onReply={onReply}
              onMention={onMention}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </article>
  );
}
