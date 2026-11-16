import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ExternalLink, Lock, PlayCircle, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/app/AppShell";
import { SubscribeButton } from "@/components/app/SubscribeButton";
import { useMember } from "@/hooks/use-member";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTimeSP } from "@/lib/format";
import { sessionTypeLabel, type LiveSession } from "@/lib/sessions";

export const Route = createFileRoute("/_authenticated/lives")({
  head: () => ({
    meta: [
      { title: "Lives e Hot Seats — Startex" },
      { name: "description", content: "Agenda de lives de tira-dúvidas, Hot Seats e aulas especiais da Startex." },
      { property: "og:title", content: "Lives e Hot Seats — Startex" },
      { property: "og:description", content: "Agenda de lives de tira-dúvidas, Hot Seats e aulas especiais da Startex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LivesPage,
});

function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sessions")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LiveSession[];
    },
  });
}

function typeIcon(type: string) {
  if (type === "aula_especial") return <Sparkles className="size-4" />;
  if (type === "hot_seat") return <Radio className="size-4" />;
  return <CalendarClock className="size-4" />;
}

function SessionCard({ s, past }: { s: LiveSession; past: boolean }) {
  const special = s.type === "aula_especial";
  return (
    <article className={`rounded-2xl border p-5 ${special ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={special ? "default" : "secondary"} className="gap-1">
              {typeIcon(s.type)} {sessionTypeLabel(s.type)}
            </Badge>
            {special && <span className="text-xs font-semibold uppercase tracking-wide text-primary">Destaque</span>}
          </div>
          <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{formatDateTimeSP(s.starts_at)}</p>
        </div>
        <div className="shrink-0">
          {!past && s.join_url ? (
            <Button asChild variant={special ? "hero" : "default"}>
              <a href={s.join_url} target="_blank" rel="noreferrer">
                Entrar na sessão <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : past && s.replay_url ? (
            <Button asChild variant="outline">
              <a href={s.replay_url} target="_blank" rel="noreferrer">
                <PlayCircle className="size-4" /> Ver replay
              </a>
            </Button>
          ) : past ? (
            <span className="text-sm text-muted-foreground">Encerrada</span>
          ) : (
            <span className="text-sm text-muted-foreground">Link em breve</span>
          )}
        </div>
      </div>
      {s.description && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{s.description}</p>}
    </article>
  );
}

function LivesPage() {
  const member = useMember();
  const sessions = useSessions();
  const hasAccess = member.data?.hasAccess ?? false;
  const now = Date.now();
  const list = sessions.data ?? [];
  const upcoming = list
    .filter((s) => new Date(s.starts_at).getTime() >= now)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  const previous = list
    .filter((s) => new Date(s.starts_at).getTime() < now)
    .sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at));

  if (!member.isLoading && !hasAccess) {
    return (
      <PageContainer>
        <h1 className="text-3xl font-bold sm:text-4xl">Lives e Hot Seats</h1>
        <div className="mt-8 flex max-w-xl flex-col items-start gap-4 rounded-2xl border border-primary/40 bg-card p-6">
          <Lock className="size-8 text-primary" />
          <p className="font-display text-lg font-semibold">Conteúdo exclusivo para assinantes</p>
          <p className="text-muted-foreground">Assine para ver a agenda, entrar nas sessões ao vivo e assistir aos replays.</p>
          <SubscribeButton />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold sm:text-4xl">Lives e Hot Seats</h1>
      <p className="mt-2 text-muted-foreground">
        Agenda de lives de tira-dúvidas, Hot Seats e aulas especiais. Horários em Brasília (America/Sao_Paulo).
      </p>

      {sessions.isLoading && (
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      )}
      {sessions.isError && (
        <div className="mt-8 rounded-xl border border-destructive/40 bg-card p-5 text-sm">
          Não foi possível carregar a agenda.{" "}
          {String((sessions.error as any)?.message ?? "").includes("sessions")
            ? "A tabela de sessões ainda não foi criada no banco (solicite no Lovable)."
            : "Tente novamente."}
        </div>
      )}

      {sessions.data && (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="text-xl font-semibold">Próximas</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-muted-foreground">Nenhuma sessão agendada no momento.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {upcoming.map((s) => (
                  <SessionCard key={s.id} s={s} past={false} />
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="text-xl font-semibold">Anteriores</h2>
            {previous.length === 0 ? (
              <p className="mt-3 text-muted-foreground">Ainda não há sessões anteriores.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {previous.map((s) => (
                  <SessionCard key={s.id} s={s} past />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
