import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Lesson = Tables<"lessons">;
export type Track = Tables<"tracks">;
export type Progress = Tables<"lesson_progress">;

export type TrackWithLessons = Track & { lessons: Lesson[] };

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: async () => {
      const [tracksRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from("tracks").select("*").eq("published", true).order("position"),
        supabase.from("lessons").select("*").eq("published", true).order("position"),
        supabase.from("lesson_progress").select("*"),
      ]);
      if (tracksRes.error) throw tracksRes.error;
      if (lessonsRes.error) throw lessonsRes.error;
      if (progressRes.error) throw progressRes.error;

      const lessons = lessonsRes.data;
      const tracks: TrackWithLessons[] = tracksRes.data
        .map((t) => ({ ...t, lessons: lessons.filter((l) => l.track_id === t.id) }))
        .filter((t) => t.lessons.length > 0);
      const progress = new Map(progressRes.data.map((p) => [p.lesson_id, p]));
      return { tracks, lessons, progress };
    },
  });
}

export function progressPercent(p: Progress | undefined): number {
  if (!p) return 0;
  return p.completed ? 100 : p.progress_percent;
}
