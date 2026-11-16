/** Aula liberada para assistir: assinante ativo/admin, ou aula marcada como amostra gratuita. */
export function canWatchLesson(lesson: { is_free_preview: boolean }, hasAccess: boolean): boolean {
  return hasAccess || lesson.is_free_preview;
}

export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeThumbnail(url: string | null | undefined): string | null {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
