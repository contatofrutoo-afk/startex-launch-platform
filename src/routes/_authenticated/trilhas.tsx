import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LessonCard, LessonRow } from "@/components/app/LessonCard";
import { SubscribeButton } from "@/components/app/SubscribeButton";
import { useMember } from "@/hooks/use-member";
import { progressPercent, useCatalog } from "@/hooks/use-catalog";
import { firstName } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/trilhas")({
  head: () => ({
    meta: [
      { title: "Trilhas — Startex" },
      { name: "description", content: "Suas trilhas de aulas na Startex." },
      { property: "og:title", content: "Trilhas — Startex" },
      { property: "og:description", content: "Trilhas de aulas gravadas para empreendedores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrilhasPage,
});

function TrilhasPage() {
  const member = useMember();
  const catalog = useCatalog();
  const hasAccess = member.data?.hasAccess ?? false;
  const name = firstName(member.data?.nome);

  return (
    <div className="space-y-10 pb-16 pt-8">
      <div className="px-4 sm:px-8">
        {member.isLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : (
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Boas-vindas{name ? `, ${name}` : ""}!
          </h1>
        )}
        <p className="mt-1 text-muted-foreground">Escolha uma trilha e continue de onde parou.</p>
      </div>

      {member.data && !hasAccess && (
        <div className="mx-4 flex flex-col gap-4 rounded-2xl border border-primary/40 bg-card p-5 sm:mx-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Seu acesso às aulas ainda não está ativo</p>
              <p className="text-sm text-muted-foreground">
                As aulas marcadas como “Amostra grátis” já estão liberadas. Assine para assistir a todas.
              </p>
            </div>
          </div>
          <SubscribeButton />
        </div>
      )}

      {catalog.isLoading && <CatalogSkeleton />}

      {catalog.isError && (
        <div className="mx-4 flex items-center gap-3 rounded-xl border border-destructive/40 bg-card p-5 sm:mx-8">
          <AlertCircle className="size-5 text-destructive" />
          <p className="flex-1">Não foi possível carregar as trilhas.</p>
          <Button variant="outline" size="sm" onClick={() => catalog.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {catalog.data && catalog.data.tracks.length === 0 && (
        <div className="mx-4 rounded-2xl border border-dashed border-border bg-surface p-10 text-center sm:mx-8">
          <p className="font-display text-lg font-semibold">Nenhuma trilha publicada ainda</p>
          <p className="mt-1 text-muted-foreground">As primeiras aulas aparecem aqui assim que forem publicadas.</p>
        </div>
      )}

      {catalog.data && (
        <>
          {(() => {
            const continuing = catalog.data.lessons
              .filter((l) => {
                const p = catalog.data.progress.get(l.id);
                return p && !p.completed;
              })
              .sort(
                (a, b) =>
                  (catalog.data.progress.get(b.id)?.updated_at ?? "").localeCompare(
                    catalog.data.progress.get(a.id)?.updated_at ?? "",
                  ),
              );
            if (continuing.length === 0) return null;
            return (
              <LessonRow title="Continuar assistindo">
                {continuing.map((l) => (
                  <LessonCard
                    key={l.id}
                    lesson={l}
                    hasAccess={hasAccess}
                    percent={progressPercent(catalog.data.progress.get(l.id))}
                  />
                ))}
              </LessonRow>
            );
          })()}
          {catalog.data.tracks.map((track) => {
            const done = track.lessons.filter((l) => catalog.data.progress.get(l.id)?.completed).length;
            return (
              <LessonRow
                key={track.id}
                title={track.title}
                subtitle={`${track.lessons.length} aulas · ${done} concluídas`}
              >
                {track.lessons.map((l) => (
                  <LessonCard
                    key={l.id}
                    lesson={l}
                    hasAccess={hasAccess}
                    percent={progressPercent(catalog.data.progress.get(l.id))}
                  />
                ))}
              </LessonRow>
            );
          })}
        </>
      )}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-10">
      {[0, 1].map((r) => (
        <div key={r} className="space-y-3 px-4 sm:px-8">
          <Skeleton className="h-7 w-56" />
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video w-[72vw] shrink-0 rounded-xl sm:w-[300px]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
