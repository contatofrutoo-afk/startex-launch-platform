import { Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, Play } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { canWatchLesson } from "@/lib/lessons";
import type { Lesson } from "@/hooks/use-catalog";

export function LessonCard({
  lesson,
  hasAccess,
  percent,
}: {
  lesson: Lesson;
  hasAccess: boolean;
  percent: number;
}) {
  const unlocked = canWatchLesson(lesson, hasAccess);
  return (
    <Link
      to="/aula/$id"
      params={{ id: lesson.id }}
      className="group/card relative block w-[72vw] shrink-0 snap-start outline-none sm:w-[300px] lg:w-[320px]"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface-raised shadow-card transition-all duration-300 group-hover/card:z-10 group-hover/card:scale-[1.04] group-hover/card:border-primary/60 group-focus-visible/card:ring-2 group-focus-visible/card:ring-ring">
        {lesson.thumbnail_url ? (
          <img
            src={lesson.thumbnail_url}
            alt=""
            loading="lazy"
            width={1280}
            height={720}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105 ${unlocked ? "" : "opacity-50 grayscale-[40%]"}`}
          />
        ) : (
          <div className="h-full w-full bg-gradient-brand opacity-40" />
        )}
        <div className="absolute inset-0 bg-card-shade" />
        <div className="absolute left-2 top-2 flex gap-1.5">
          {lesson.is_free_preview && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold uppercase text-primary-foreground">
              Amostra grátis
            </span>
          )}
          {lesson.is_sample && (
            <span className="rounded-md bg-background/80 px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
              Exemplo
            </span>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {unlocked ? (
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground opacity-0 transition-opacity group-hover/card:opacity-100">
              <Play className="size-5 fill-current" />
            </span>
          ) : (
            <span className="flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground">
              <Lock className="size-5" />
            </span>
          )}
        </div>
        <span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-xs font-medium">
          {formatDuration(lesson.duration_seconds)}
        </span>
        {percent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-muted">
            <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-start gap-1.5 px-0.5">
        {percent === 100 && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />}
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground/90 group-hover/card:text-foreground">
          {lesson.title}
        </p>
      </div>
    </Link>
  );
}

export function LessonRow({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="px-4 sm:px-8">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 pt-2 sm:scroll-px-8 sm:px-8">
        {children}
      </div>
    </section>
  );
}
