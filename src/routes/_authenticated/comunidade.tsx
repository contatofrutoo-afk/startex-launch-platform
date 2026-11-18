import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Globe2, Heart, Lock, MessageCircle, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/app/AppShell";
import { CommunityComposer } from "@/components/community/CommunityComposer";
import { CommunityMessageCard } from "@/components/community/CommunityMessageCard";
import { MemberPickerDialog } from "@/components/community/MemberPickerDialog";
import {
  communityMessagesKey,
  communityThreadsKey,
  useCommunityMessages,
  useCommunityThreads,
} from "@/hooks/use-community";
import { useMember } from "@/hooks/use-member";
import {
  communityDisplayName,
  createPrivateThread,
  deleteCommunityMessage,
  initials,
  insertCommunityMessage,
  profileLocation,
  setCommunityLike,
  type CommunityMessageView,
  type CommunityProfile,
} from "@/lib/community";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade — Startex" },
      {
        name: "description",
        content: "Converse, tire dúvidas e faça novas parcerias na comunidade Startex.",
      },
      { property: "og:title", content: "Comunidade — Startex" },
      {
        property: "og:description",
        content: "O ponto de encontro das empreendedoras da Startex.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComunidadePage,
});

type Tab = "general" | "private";

function ComunidadePage() {
  const queryClient = useQueryClient();
  const { data: member, isLoading: memberLoading } = useMember();
  const { data: threadsData, isLoading: threadsLoading } = useCommunityThreads(member?.userId);

  const [tab, setTab] = useState<Tab>("general");
  const [selectedGeneralId, setSelectedGeneralId] = useState<string | null>(null);
  const [selectedPrivateId, setSelectedPrivateId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<CommunityProfile[]>([]);
  const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommunityMessageView | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [likePending, setLikePending] = useState<Record<string, boolean>>({});

  const generalThreads = threadsData?.general ?? [];
  const privateThreads = threadsData?.privateThreads ?? [];
  const profiles = threadsData?.profiles ?? [];
  const loading = memberLoading || threadsLoading;

  const selectedGeneralThread =
    generalThreads.find((thread) => thread.id === selectedGeneralId) ?? null;
  const selectedPrivateThread =
    privateThreads.find((thread) => thread.id === selectedPrivateId) ?? null;
  const selectedThread = tab === "general" ? selectedGeneralThread : selectedPrivateThread;
  const selectedThreadId = selectedThread?.id ?? null;

  const { data: messages, isLoading: messagesLoading } = useCommunityMessages(
    selectedThreadId,
    member?.userId,
  );

  useEffect(() => {
    if (selectedGeneralId || generalThreads.length === 0) return;
    const first = generalThreads[0];
    if (first) setSelectedGeneralId(first.id);
  }, [generalThreads, selectedGeneralId]);

  useEffect(() => {
    if (selectedPrivateId || privateThreads.length === 0) return;
    const first = privateThreads[0];
    if (first) setSelectedPrivateId(first.id);
  }, [privateThreads, selectedPrivateId]);

  function resetComposer() {
    setContent("");
    setMentions([]);
    setReplyTo(null);
  }

  function selectThread(nextTab: Tab, id: string) {
    setTab(nextTab);
    if (nextTab === "general") setSelectedGeneralId(id);
    else setSelectedPrivateId(id);
    resetComposer();
  }

  function addMention(profile: CommunityProfile) {
    setMentions((current) =>
      current.some((item) => item.id === profile.id) ? current : [...current, profile],
    );
    setMentionPickerOpen(false);
  }

  async function submitMessage() {
    if (!member || !selectedThreadId) return;
    const trimmed = content.trim();
    if (!trimmed && mentions.length === 0) return;

    setSubmitting(true);
    try {
      await insertCommunityMessage({
        threadId: selectedThreadId,
        userId: member.userId,
        content: trimmed,
        parentId: replyTo?.id ?? null,
        mentionedUserIds: mentions.map((profile) => profile.id),
      });
      resetComposer();
      queryClient.invalidateQueries({ queryKey: communityMessagesKey(selectedThreadId) });
      queryClient.invalidateQueries({ queryKey: communityThreadsKey });
    } catch {
      toast.error("Não foi possível comentar agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike(message: CommunityMessageView) {
    if (!member) return;
    const wasLiked = message.likedByMe;
    const key = communityMessagesKey(message.thread_id);

    const updateTree = (items: CommunityMessageView[]): CommunityMessageView[] =>
      items.map((item) => {
        if (item.id === message.id) {
          return {
            ...item,
            likedByMe: !wasLiked,
            likeCount: Math.max(0, item.likeCount + (wasLiked ? -1 : 1)),
            likes: wasLiked
              ? item.likes.filter((like) => like.user_id !== member.userId)
              : [...item.likes, { message_id: item.id, user_id: member.userId }],
          };
        }
        if (item.replies.length > 0) {
          return { ...item, replies: updateTree(item.replies) };
        }
        return item;
      });

    setLikePending((current) => ({ ...current, [message.id]: true }));
    queryClient.setQueryData<CommunityMessageView[]>(key, (current) =>
      current ? updateTree(current) : current,
    );

    try {
      await setCommunityLike(message.id, member.userId, wasLiked);
    } catch {
      toast.error("Não foi possível atualizar a curtida.");
    } finally {
      setLikePending((current) => {
        const next = { ...current };
        delete next[message.id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: key });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteCommunityMessage(target.id);
      toast.success("Comentário excluído.");
      queryClient.invalidateQueries({ queryKey: communityMessagesKey(target.thread_id) });
      queryClient.invalidateQueries({ queryKey: communityThreadsKey });
    } catch {
      toast.error("Não foi possível excluir o comentário.");
    }
  }

  async function startPrivateConversation(profile: CommunityProfile) {
    setNewConversationOpen(false);
    try {
      const threadId = await createPrivateThread(profile.id);
      await queryClient.invalidateQueries({ queryKey: communityThreadsKey });
      setTab("private");
      setSelectedPrivateId(threadId);
      resetComposer();
      queryClient.invalidateQueries({ queryKey: communityMessagesKey(threadId) });
    } catch {
      toast.error("Não foi possível iniciar a conversa.");
    }
  }

  const meProfile: CommunityProfile | null = member
    ? {
        id: member.userId,
        nome: member.nome,
        avatar_url: member.avatarUrl || null,
        cidade: member.cidade,
        estado: member.estado,
      }
    : null;

  const otherMembers = profiles.filter((profile) => profile.id !== member?.userId);
  const isLikeLoading = (messageId: string) => Boolean(likePending[messageId]);

  return (
    <PageContainer>
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#4568dc_0%,#6a5acd_48%,#e73c7e_100%)] p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-10 size-56 rounded-full bg-white/10" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            <Heart className="size-3.5 fill-current" /> Comunidade Startex
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            O ponto de encontro das empreendedoras
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
            Converse com outras membros, compartilhe ideias, tire dúvidas e faça novas parcerias. Um
            espaço feito para a nossa comunidade.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" /> {profiles.length} membros
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="size-4" /> Conversas gerais e privadas
            </span>
          </div>
        </div>
      </section>

      <div
        role="tablist"
        aria-label="Tipo de conversa"
        className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "general"}
          onClick={() => {
            setTab("general");
            resetComposer();
          }}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            tab === "general"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Globe2 className="size-4" /> Conversas gerais
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "private"}
          onClick={() => {
            setTab("private");
            resetComposer();
          }}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            tab === "private"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Lock className="size-4" /> Conversas privadas
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          {tab === "general" ? (
            <>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <Globe2 className="size-4 text-primary" /> Fóruns da comunidade
              </h2>
              <div className="mt-3 space-y-2">
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full rounded-xl" />
                  ))
                ) : generalThreads.length === 0 ? (
                  <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                    Nenhum fórum disponível ainda.
                  </p>
                ) : (
                  generalThreads.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => selectThread("general", thread.id)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-colors",
                        selectedThreadId === thread.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40 hover:bg-secondary/60",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <MessageCircle className="size-4 shrink-0 text-primary" /> {thread.title}
                      </span>
                      {thread.description && (
                        <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                          {thread.description}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  <Lock className="size-4 text-primary" /> Suas conversas
                </h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setNewConversationOpen(true)}
                >
                  <Plus className="size-4" /> Nova
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-xl" />
                  ))
                ) : privateThreads.length === 0 ? (
                  <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                    <p>Você ainda não tem conversas privadas.</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setNewConversationOpen(true)}
                    >
                      <Plus className="size-4" /> Começar conversa
                    </Button>
                  </div>
                ) : (
                  privateThreads.map((thread) => {
                    const other = thread.otherProfile;
                    const name = communityDisplayName(other);
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => selectThread("private", thread.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                          selectedThreadId === thread.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40 hover:bg-secondary/60",
                        )}
                      >
                        <Avatar className="size-10 border border-border">
                          {other?.avatar_url ? (
                            <AvatarImage src={other.avatar_url} alt={name} />
                          ) : null}
                          <AvatarFallback>{initials(other?.nome ?? name)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {profileLocation(other)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </aside>

        <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          {selectedThread ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  {tab === "private" && selectedPrivateThread ? (
                    <Avatar className="size-11 border-2 border-primary/20">
                      {selectedPrivateThread.otherProfile?.avatar_url ? (
                        <AvatarImage
                          src={selectedPrivateThread.otherProfile.avatar_url}
                          alt={communityDisplayName(selectedPrivateThread.otherProfile)}
                        />
                      ) : null}
                      <AvatarFallback>
                        {initials(selectedPrivateThread.otherProfile?.nome)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="flex size-11 items-center justify-center rounded-full bg-gradient-brand text-white">
                      <Globe2 className="size-5" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">
                      {tab === "private" && selectedPrivateThread
                        ? communityDisplayName(selectedPrivateThread.otherProfile)
                        : selectedGeneralThread?.title}
                    </h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {tab === "private" && selectedPrivateThread
                        ? "Conversa privada entre vocês"
                        : selectedGeneralThread?.description ||
                          "Conversa aberta para todos os membros"}
                    </p>
                  </div>
                </div>
                {tab === "general" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Globe2 className="size-3.5" /> Público
                  </span>
                )}
              </header>

              <div className="mt-4 max-h-[58vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[55vh]">
                {loading || messagesLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 w-full rounded-2xl" />
                  ))
                ) : !messages || messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
                    <MessageCircle className="mx-auto size-8 text-primary" />
                    <p className="mt-2 text-sm font-semibold">Nenhum comentário ainda</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Seja a primeira a comentar neste espaço.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <CommunityMessageCard
                      key={message.id}
                      message={message}
                      currentUserId={member?.userId ?? ""}
                      isAdmin={Boolean(member?.isAdmin)}
                      isLikeLoading={isLikeLoading}
                      onToggleLike={toggleLike}
                      onReply={(target) =>
                        setReplyTo({
                          id: target.id,
                          authorName: communityDisplayName(target.author),
                        })
                      }
                      onMention={addMention}
                      onDelete={setDeleteTarget}
                    />
                  ))
                )}
              </div>

              <div className="mt-4 border-t border-border pt-4">
                {member && meProfile ? (
                  <CommunityComposer
                    me={meProfile}
                    value={content}
                    onChange={setContent}
                    onSubmit={submitMessage}
                    submitting={submitting}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                    mentions={mentions}
                    onRemoveMention={(id) =>
                      setMentions((current) => current.filter((profile) => profile.id !== id))
                    }
                    onOpenMentionPicker={() => setMentionPickerOpen(true)}
                  />
                ) : (
                  <Skeleton className="h-28 w-full rounded-2xl" />
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <Heart className="size-10 text-primary" />
              <h2 className="mt-3 text-lg font-bold">Escolha uma conversa</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Selecione um fórum ou uma conversa privada para começar a participar.
              </p>
              {tab === "private" && (
                <Button type="button" className="mt-4" onClick={() => setNewConversationOpen(true)}>
                  <Plus className="size-4" /> Nova conversa privada
                </Button>
              )}
            </div>
          )}
        </section>
      </div>

      <MemberPickerDialog
        open={mentionPickerOpen}
        onOpenChange={setMentionPickerOpen}
        title="Mencionar membro"
        description="Escolha quem você quer marcar neste comentário."
        members={otherMembers}
        emptyLabel="Nenhum outro membro encontrado."
        onSelect={addMention}
      />
      <MemberPickerDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        title="Nova conversa privada"
        description="Escolha um membro para conversar em particular."
        members={otherMembers}
        emptyLabel="Nenhum outro membro disponível."
        onSelect={startPrivateConversation}
      />
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O comentário e as respostas serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
