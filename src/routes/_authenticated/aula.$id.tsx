import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ChevronRight, Circle, Film, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscribeButton } from "@/components/app/SubscribeButton";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/hooks/use-member";
import { canWatchLesson, youtubeId } from "@/lib/lessons";
import { formatDuration } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/aula/$id")({
  head: () => ({
    meta: [
      { title: "Aula — Startex" },
      { name: "description", content: "Assista à aula na área de membros Startex." },
      { property: "og:title", content: "Aula — Startex" },
      { property: "og:description", content: "Aula da área de membros Startex." },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AulaPage,
});

function useLesson(id: string) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const { data: lesson, error } = await supabase.from("lessons").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!lesson) return null;
      const [trackRes, siblingsRes, mediaRes, progressRes] = await Promise.all([
        supabase.from("tracks").select("id, title").eq("id", lesson.track_id).maybeSingle(),
        supabase
          .from("lessons")
          .select("id, title, position, duration_seconds")
          .eq("track_id", lesson.track_id)
          .eq("published", true)
          .order("position"),
        supabase.from("lesson_media").select("*").eq("lesson_id", id).maybeSingle(),
        supabase.from("lesson_progress").select("*").eq("lesson_id", id).maybeSingle(),
      ]);
      let videoUrl: string | null = null;
      const media = mediaRes.data;
      if (media?.source_type === "upload" && media.video_path) {
        const { data: signed } = await supabase.storage.from("videos").createSignedUrl(media.video_path, 60 * 60);
        videoUrl = signed?.signedUrl ?? null;
      }
      return {
        lesson,
        track: trackRes.data,
        siblings: siblingsRes.data ?? [],
        media,
        videoUrl,
        progress: progressRes.data,
      };
    },
  });
}

function AulaPage() {
  const { id } = Route.useParams();
  const member = useMember();
  const q = useLesson(id);
  const queryClient = useQueryClient();
  const hasAccess = member.data?.hasAccess ?? false;
  const unlocked = q.data ? canWatchLesson(q.data.lesson, hasAccess) : false;
  const userId = member.data?.userId;

  // Registra que o aluno começou a aula (para "Continuar assistindo").
  useEffect(() => {
    if (!userId || !q.data || !unlocked || q.data.progress) return;
    supabase
      .from("lesson_progress")
      .upsert(
        { user_id: userId, lesson_id: id, completed: false, progress_percent: 10 },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
      )
      .then(() => queryClient.invalidateQueries({ queryKey: ["catalog"] }));
  }, [userId, q.data, unlocked, id, queryClient]);

  const toggleComplete = useMutation({
    mutationFn: async (completed: boolean) => {
      if (!userId) throw new Error("Sessão expirada");
      const { error } = await supabase.from("lesson_progress").upsert(
        { user_id: userId, lesson_id: id, completed, progress_percent: completed ? 100 : 10 },
        { onConflict: "user_id,lesson_id" },
      );
      if (error) throw error;
    },
    onSuccess: (_d, completed) => {
      toast.success(completed ? "Aula marcada como concluída." : "Aula marcada como não concluída.");
      queryClient.invalidateQueries({ queryKey: ["lesson", id] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: () => toast.error("Não foi possível salvar seu progresso. Tente novamente."),
  });

  if (q.isLoading || member.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-8">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-display text-xl font-semibold">Aula não encontrada</p>
        <p className="mt-2 text-muted-foreground">Ela pode ter sido removida ou ainda não foi publicada.</p>
        <Button asChild className="mt-6">
          <Link to="/trilhas">Voltar para as trilhas</Link>
        </Button>
      </div>
    );
  }

  const { lesson, track, siblings, media, videoUrl, progress } = q.data;
  const idx = siblings.findIndex((s) => s.id === lesson.id);
  const next = idx >= 0 ? siblings[idx + 1] : undefined;
  const completed = progress?.completed ?? false;
  const ytId = youtubeId(media?.youtube_url);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <Link to="/trilhas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Trilhas
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            {!unlocked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                {lesson.thumbnail_url && (
                  <img src={lesson.thumbnail_url} alt="" className="absolute inset-0 -z-0 h-full w-full object-cover opacity-20" />
                )}
                <Lock className="relative size-10 text-primary" />
                <p className="relative max-w-sm font-semibold">Esta aula é exclusiva para assinantes.</p>
                <SubscribeButton className="relative" />
              </div>
            ) : ytId ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : videoUrl ? (
              <video className="absolute inset-0 h-full w-full bg-background" src={videoUrl} controls playsInline poster={lesson.thumbnail_url ?? undefined} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                {lesson.thumbnail_url && (
                  <img src={lesson.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                )}
                <Film className="relative size-10 text-muted-foreground" />
                <p className="relative max-w-sm text-muted-foreground">
                  {lesson.is_sample
                    ? "Aula de exemplo: o vídeo real será adicionado pelo administrador."
                    : "O vídeo desta aula ainda não foi enviado."}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {track && <p className="text-sm font-semibold text-primary">{track.title}</p>}
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{formatDuration(lesson.duration_seconds)}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {unlocked && (
                <Button
                  variant={completed ? "secondary" : "outline"}
                  onClick={() => toggleComplete.mutate(!completed)}
                  disabled={toggleComplete.isPending}
                >
                  {completed ? <CheckCircle2 className="text-success" /> : <Circle />}
                  {completed ? "Concluída" : "Marcar como concluída"}
                </Button>
              )}
              {next && (
                <Button asChild variant="hero">
                  <Link to="/aula/$id" params={{ id: next.id }}>
                    Próxima aula <ChevronRight />
                  </Link>
                </Button>
              )}
            </div>
          </div>
          {lesson.description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">{lesson.description}</p>
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-4">
          <p className="px-2 pb-3 font-display font-semibold">Aulas desta trilha</p>
          <ol className="space-y-1">
            {siblings.map((s, i) => (
              <li key={s.id}>
                <Link
                  to="/aula/$id"
                  params={{ id: s.id }}
                  className={`flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-secondary ${s.id === lesson.id ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
                >
                  <span className="w-5 text-center font-display font-bold text-primary/70">{i + 1}</span>
                  <span className="line-clamp-2 flex-1">{s.title}</span>
                  <span className="text-xs">{formatDuration(s.duration_seconds)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
