import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Clapperboard,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Radio,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Upload,
  UserCheck,
  UserX,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { PageContainer } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/hooks/use-member";
import { formatBRL, formatDateSP, formatDateTimeSP } from "@/lib/format";
import { SESSION_TYPE_LABEL, sessionTypeLabel, type LiveSession, type SessionType } from "@/lib/sessions";
import { PRODUCT_TYPE_LABEL, effectivePriceCents, productTypeLabel, type Product, type ProductType } from "@/lib/products";
import { youtubeThumbnail } from "@/lib/lessons";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin - Startex" },
      { name: "description", content: "Painel administrativo da plataforma Startex." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type TrackRow = {
  id: string;
  title: string;
  description: string;
  position: number;
  published: boolean;
  is_sample: boolean;
  cover_url: string | null;
};

type LessonRow = {
  id: string;
  track_id: string;
  title: string;
  description: string;
  position: number;
  published: boolean;
  is_free_preview: boolean;
  is_sample: boolean;
  duration_seconds: number;
  thumbnail_url: string | null;
};

type LessonMediaRow = {
  lesson_id: string;
  source_type: "upload" | "youtube";
  video_path: string | null;
  youtube_url: string | null;
  materials: any;
};

function AdminPage() {
  const member = useMember();
  if (!member.isLoading && !member.data?.isAdmin) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-destructive/40 bg-card p-6">
          <p className="font-display text-lg font-semibold">Acesso restrito</p>
          <p className="mt-1 text-muted-foreground">
            Esta área é exclusiva para administradores. Peça a um admin para liberar seu acesso.
          </p>
        </div>
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-7 text-primary" />
        <h1 className="text-3xl font-bold sm:text-4xl">Admin</h1>
      </div>
      <p className="mt-2 text-muted-foreground">Gerencie aulas, trilhas, lives, produtos, alunos e vendas.</p>
      <Tabs defaultValue="aulas" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-5">
          <TabsTrigger value="aulas"><Clapperboard className="mr-2 size-4" /> Aulas</TabsTrigger>
          <TabsTrigger value="lives"><Radio className="mr-2 size-4" /> Lives</TabsTrigger>
          <TabsTrigger value="loja"><ShoppingBag className="mr-2 size-4" /> Loja</TabsTrigger>
          <TabsTrigger value="alunos"><Users className="mr-2 size-4" /> Alunos</TabsTrigger>
          <TabsTrigger value="vendas"><Download className="mr-2 size-4" /> Vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="aulas" className="mt-6"><AdminAulas /></TabsContent>
        <TabsContent value="lives" className="mt-6"><AdminLives /></TabsContent>
        <TabsContent value="loja" className="mt-6"><AdminProducts /></TabsContent>
        <TabsContent value="alunos" className="mt-6"><AdminStudents /></TabsContent>
        <TabsContent value="vendas" className="mt-6"><AdminOrders /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

async function uploadWithProgress(bucket: string, path: string, file: File, onProgress: (p: number) => void) {
  if (import.meta.env.MODE === "demo") {
    await new Promise((resolve) => setTimeout(resolve, 350));
    onProgress(100);
    return { path };
  }
  const url = `${import.meta.env["VITE_SUPABASE_URL"]}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const apikey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("apikey", apikey);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(xhr.responseText || `Upload falhou (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Falha de rede no upload"));
    xhr.send(file);
  });
  return { path };
}

function AdminAulas() {
  const qc = useQueryClient();
  const tracksQ = useQuery({
    queryKey: ["admin-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tracks").select("*").order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TrackRow[];
    },
  });
  const lessonsQ = useQuery({
    queryKey: ["admin-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LessonRow[];
    },
  });
  const mediaQ = useQuery({
    queryKey: ["admin-lesson-media"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("lesson_media").select("*");
      if (error) throw error;
      return (data ?? []) as LessonMediaRow[];
    },
  });

  const mediaByLesson = useMemo(() => {
    const m = new Map<string, LessonMediaRow>();
    for (const r of mediaQ.data ?? []) m.set(r.lesson_id, r);
    return m;
  }, [mediaQ.data]);

  const [trackOpen, setTrackOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrackRow | null>(null);
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tPublished, setTPublished] = useState(true);
  const [tCover, setTCover] = useState("");
  const [savingTrack, setSavingTrack] = useState(false);

  const [lessonOpen, setLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonRow | null>(null);
  const [lTitle, setLTitle] = useState("");
  const [lDesc, setLDesc] = useState("");
  const [lTrack, setLTrack] = useState("");
  const [lPublished, setLPublished] = useState(false);
  const [lFree, setLFree] = useState(false);
  const [lDuration, setLDuration] = useState(0);
  const [lThumb, setLThumb] = useState("");
  const [lSource, setLSource] = useState<"youtube" | "upload">("youtube");
  const [lYoutube, setLYoutube] = useState("");
  const [lVideoPath, setLVideoPath] = useState("");
  const [lMaterials, setLMaterials] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [thumbProgress, setThumbProgress] = useState<number | null>(null);
  const [matProgress, setMatProgress] = useState<number | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const matRef = useRef<HTMLInputElement>(null);
  const trackCoverRef = useRef<HTMLInputElement>(null);
  const [trackCoverProgress, setTrackCoverProgress] = useState<number | null>(null);

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["admin-tracks"] });
    qc.invalidateQueries({ queryKey: ["admin-lessons"] });
    qc.invalidateQueries({ queryKey: ["admin-lesson-media"] });
    qc.invalidateQueries({ queryKey: ["catalog"] });
  }

  function openNewTrack() {
    setEditingTrack(null);
    setTTitle(""); setTDesc(""); setTPublished(true); setTCover("");
    setTrackOpen(true);
  }
  function openEditTrack(t: TrackRow) {
    setEditingTrack(t);
    setTTitle(t.title); setTDesc(t.description || ""); setTPublished(t.published); setTCover(t.cover_url || "");
    setTrackOpen(true);
  }
  async function saveTrack() {
    if (!tTitle.trim()) { toast.error("Informe o título da trilha."); return; }
    setSavingTrack(true);
    try {
      if (editingTrack) {
        const { error } = await supabase.from("tracks").update({ title: tTitle.trim(), description: tDesc, published: tPublished, cover_url: tCover || null }).eq("id", editingTrack.id);
        if (error) throw error;
      } else {
        const maxPos = Math.max(0, ...(tracksQ.data ?? []).map((t) => t.position));
        const { error } = await supabase.from("tracks").insert({ title: tTitle.trim(), description: tDesc, published: tPublished, cover_url: tCover || null, position: maxPos + 1 });
        if (error) throw error;
      }
      toast.success("Trilha salva.");
      setTrackOpen(false);
      invalidateAll();
    } catch { toast.error("Erro ao salvar trilha."); }
    finally { setSavingTrack(false); }
  }
  async function deleteTrack(t: TrackRow) {
    if (!confirm(`Excluir a trilha "${t.title}" e suas aulas?`)) return;
    const { error } = await supabase.from("tracks").delete().eq("id", t.id);
    if (error) { toast.error("Não foi possível excluir (verifique se há aulas vinculadas)."); return; }
    toast.success("Trilha excluída."); invalidateAll();
  }
  async function moveTrack(t: TrackRow, dir: -1 | 1) {
    const list = [...(tracksQ.data ?? [])];
    const i = list.findIndex((x) => x.id === t.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[i]!, b = list[j]!;
    await Promise.all([
      supabase.from("tracks").update({ position: b.position }).eq("id", a.id),
      supabase.from("tracks").update({ position: a.position }).eq("id", b.id),
    ]);
    invalidateAll();
  }

  function openNewLesson(trackId?: string) {
    setEditingLesson(null);
    setLTitle(""); setLDesc(""); setLTrack(trackId || tracksQ.data?.[0]?.id || "");
    setLPublished(false); setLFree(false); setLDuration(0); setLThumb(""); setLSource("youtube"); setLYoutube(""); setLVideoPath(""); setLMaterials("");
    setLessonOpen(true);
  }
  function openEditLesson(l: LessonRow) {
    const m = mediaByLesson.get(l.id);
    setEditingLesson(l);
    setLTitle(l.title); setLDesc(l.description || ""); setLTrack(l.track_id);
    setLPublished(l.published); setLFree(l.is_free_preview); setLDuration(l.duration_seconds || 0); setLThumb(l.thumbnail_url || "");
    setLSource((m?.source_type as any) === "upload" ? "upload" : "youtube");
    setLYoutube(m?.youtube_url || ""); setLVideoPath(m?.video_path || "");
    setLMaterials(Array.isArray(m?.materials) ? (m!.materials as string[]).join("\n") : (typeof m?.materials === "string" ? m!.materials : ""));
    setLessonOpen(true);
  }
  async function saveLesson() {
    if (!lTitle.trim()) { toast.error("Informe o título da aula."); return; }
    if (!lTrack) { toast.error("Selecione uma trilha."); return; }
    setSavingLesson(true);
    try {
      let lessonId = editingLesson?.id;
      let thumb = lThumb.trim() || null;
      if (!thumb && lSource === "youtube") thumb = youtubeThumbnail(lYoutube);
      if (editingLesson) {
        const { error } = await supabase.from("lessons").update({
          title: lTitle.trim(), description: lDesc, track_id: lTrack, published: lPublished, is_free_preview: lFree,
          duration_seconds: Number(lDuration) || 0, thumbnail_url: thumb,
        }).eq("id", editingLesson.id);
        if (error) throw error;
      } else {
        const maxPos = Math.max(0, ...(lessonsQ.data ?? []).filter((x) => x.track_id === lTrack).map((x) => x.position));
        const { data, error } = await supabase.from("lessons").insert({
          title: lTitle.trim(), description: lDesc, track_id: lTrack, published: lPublished, is_free_preview: lFree,
          duration_seconds: Number(lDuration) || 0, thumbnail_url: thumb, position: maxPos + 1,
        }).select("id").single();
        if (error) throw error;
        lessonId = data.id;
      }
      if (lessonId) {
        const mats = lMaterials.split("\n").map((s) => s.trim()).filter(Boolean);
        const payload = {
          lesson_id: lessonId,
          source_type: lSource,
          youtube_url: lSource === "youtube" ? (lYoutube.trim() || null) : null,
          video_path: lSource === "upload" ? (lVideoPath.trim() || null) : null,
          materials: mats,
        };
        const { error: mErr } = await (supabase as any).from("lesson_media").upsert(payload, { onConflict: "lesson_id" });
        if (mErr) throw mErr;
      }
      toast.success("Aula salva.");
      setLessonOpen(false);
      invalidateAll();
    } catch (e: any) {
      toast.error(e?.message?.includes("lesson_media") ? "Aula salva, mas falha ao salvar mídia (verifique tabela lesson_media no banco)." : "Erro ao salvar aula.");
      invalidateAll();
    } finally { setSavingLesson(false); }
  }
  async function deleteLesson(l: LessonRow) {
    if (!confirm(`Excluir a aula "${l.title}"?`)) return;
    await (supabase as any).from("lesson_media").delete().eq("lesson_id", l.id);
    const { error } = await supabase.from("lessons").delete().eq("id", l.id);
    if (error) { toast.error("Não foi possível excluir a aula."); return; }
    toast.success("Aula excluída."); invalidateAll();
  }
  async function moveLesson(l: LessonRow, dir: -1 | 1) {
    const list = (lessonsQ.data ?? []).filter((x) => x.track_id === l.track_id);
    const i = list.findIndex((x) => x.id === l.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[i]!, b = list[j]!;
    await Promise.all([
      supabase.from("lessons").update({ position: b.position }).eq("id", a.id),
      supabase.from("lessons").update({ position: a.position }).eq("id", b.id),
    ]);
    invalidateAll();
  }

  async function onUploadVideo(file: File) {
    if (file.size > 1024 * 1024 * 1024) { toast.error("Arquivo muito grande. Use link do YouTube para vídeos grandes."); }
    setVideoProgress(0);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `aulas/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
      const res = await uploadWithProgress("videos", path, file, setVideoProgress);
      setLVideoPath(res.path);
      setLSource("upload");
      toast.success("Vídeo enviado.");
    } catch { toast.error("Falha no upload do vídeo. Verifique o bucket 'videos' e permissões."); }
    finally { setVideoProgress(null); }
  }
  async function onUploadThumb(file: File) {
    setThumbProgress(0);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `aulas/thumbs/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
      const res = await uploadWithProgress("capas", path, file, setThumbProgress);
      setLThumb(res.path);
      toast.success("Thumbnail enviada.");
    } catch { toast.error("Falha no upload da thumbnail (bucket 'capas')."); }
    finally { setThumbProgress(null); }
  }
  async function onUploadMaterial(file: File) {
    setMatProgress(0);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `materiais/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
      const res = await uploadWithProgress("produtos", path, file, setMatProgress);
      setLMaterials((prev) => (prev ? `${prev}\n${res.path}` : res.path));
      toast.success("Material anexado (caminho adicionado).");
    } catch { toast.error("Falha no upload do material (bucket 'produtos')."); }
    finally { setMatProgress(null); }
  }
  async function onUploadTrackCover(file: File) {
    setTrackCoverProgress(0);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `trilhas/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
      const res = await uploadWithProgress("capas", path, file, setTrackCoverProgress);
      setTCover(res.path);
      toast.success("Capa enviada.");
    } catch { toast.error("Falha no upload da capa (bucket 'capas')."); }
    finally { setTrackCoverProgress(null); }
  }

  const loading = tracksQ.isLoading || lessonsQ.isLoading;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p><strong>Limite de upload:</strong> o envio direto depende do limite do storage/proxy (geralmente até ~50–100 MB; em alguns ambientes menor). Para vídeos grandes, use <strong>link do YouTube</strong> (aceita vídeo não listado) e cole a URL.</p>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Trilhas</h2>
          <Button onClick={openNewTrack}><Plus className="size-4" /> Nova trilha</Button>
        </div>
        {loading && <Skeleton className="mt-4 h-32 w-full rounded-2xl" />}
        {tracksQ.isError && <p className="mt-4 text-sm text-destructive">Não foi possível carregar trilhas.</p>}
        {tracksQ.data && (
          <div className="mt-4 space-y-3">
            {tracksQ.data.length === 0 && <p className="text-muted-foreground">Nenhuma trilha criada.</p>}
            {tracksQ.data.map((t, i) => {
              const tLessons = (lessonsQ.data ?? []).filter((l) => l.track_id === t.id);
              return (
                <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{t.title}</h3>
                        <Badge variant={t.published ? "default" : "secondary"}>{t.published ? "Publicada" : "Rascunho"}</Badge>
                        <span className="text-xs text-muted-foreground">{tLessons.length} aulas</span>
                      </div>
                      {t.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => moveTrack(t, -1)} disabled={i === 0}><ArrowUp className="size-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => moveTrack(t, 1)} disabled={i === (tracksQ.data!.length - 1)}><ArrowDown className="size-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => openNewLesson(t.id)}><Plus className="size-4" /> Aula</Button>
                      <Button size="sm" variant="outline" onClick={() => openEditTrack(t)}><Pencil className="size-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteTrack(t)}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                  {tLessons.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-border pt-3">
                      {tLessons.map((l, li) => (
                        <div key={l.id} className="flex flex-col gap-2 rounded-xl bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{l.position}. {l.title}</p>
                            <div className="mt-1 flex flex-wrap gap-1 text-xs">
                              <Badge variant={l.published ? "default" : "secondary"}>{l.published ? "Publicado" : "Rascunho"}</Badge>
                              {l.is_free_preview && <Badge variant="outline">Amostra grátis</Badge>}
                              <span className="text-muted-foreground">{(mediaByLesson.get(l.id)?.source_type === "upload") ? "Upload" : "YouTube"}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Button size="icon" variant="ghost" onClick={() => moveLesson(l, -1)} disabled={li === 0}><ArrowUp className="size-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => moveLesson(l, 1)} disabled={li === tLessons.length - 1}><ArrowDown className="size-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => openEditLesson(l)}><Pencil className="size-4" /> Editar</Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteLesson(l)}><Trash2 className="size-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTrack ? "Editar trilha" : "Nova trilha"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Nome</Label><Input value={tTitle} onChange={(e) => setTTitle(e.target.value)} /></div>
            <div><Label>Descrição</Label><Textarea value={tDesc} onChange={(e) => setTDesc(e.target.value)} rows={3} /></div>
            <div className="flex items-center gap-2"><Switch checked={tPublished} onCheckedChange={setTPublished} /><Label>Publicada</Label></div>
            <div>
              <Label>Capa (URL ou upload)</Label>
              <div className="mt-1 flex gap-2">
                <Input value={tCover} onChange={(e) => setTCover(e.target.value)} placeholder="https://..." />
                <Button type="button" variant="outline" onClick={() => trackCoverRef.current?.click()} disabled={trackCoverProgress !== null}><Upload className="size-4" /></Button>
                <input ref={trackCoverRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadTrackCover(e.target.files[0])} />
              </div>
              {trackCoverProgress !== null && <div className="mt-2"><Progress value={trackCoverProgress} /><p className="text-xs text-muted-foreground mt-1">{trackCoverProgress}%</p></div>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackOpen(false)}>Cancelar</Button>
            <Button onClick={saveTrack} disabled={savingTrack}>{savingTrack ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingLesson ? "Editar aula" : "Nova aula"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Título</Label><Input value={lTitle} onChange={(e) => setLTitle(e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={lDesc} onChange={(e) => setLDesc(e.target.value)} rows={3} /></div>
            <div>
              <Label>Trilha</Label>
              <Select value={lTrack} onValueChange={setLTrack}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{(tracksQ.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Duração (segundos)</Label><Input type="number" value={lDuration} onChange={(e) => setLDuration(Number(e.target.value))} /></div>
            <div className="flex items-center gap-2"><Switch checked={lPublished} onCheckedChange={setLPublished} /><Label>Publicado</Label></div>
            <div className="flex items-center gap-2"><Switch checked={lFree} onCheckedChange={setLFree} /><Label>Amostra gratuita</Label></div>

            <div className="sm:col-span-2 rounded-xl border border-border p-3 space-y-3">
              <Label>Origem do vídeo</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={lSource === "youtube" ? "default" : "outline"} onClick={() => setLSource("youtube")}><LinkIcon className="size-4" /> Link do YouTube</Button>
                <Button type="button" size="sm" variant={lSource === "upload" ? "default" : "outline"} onClick={() => setLSource("upload")}><Video className="size-4" /> Upload direto</Button>
              </div>
              {lSource === "youtube" ? (
                <div>
                  <Label>URL do YouTube (aceita vídeo não listado)</Label>
                  <Input value={lYoutube} onChange={(e) => setLYoutube(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                  <p className="mt-1 text-xs text-muted-foreground">Para vídeos grandes, prefira o link do YouTube.</p>
                </div>
              ) : (
                <div>
                  <Label>Upload de vídeo (arquivo do computador)</Label>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => videoRef.current?.click()} disabled={videoProgress !== null}><Upload className="size-4" /> Enviar vídeo</Button>
                    {lVideoPath && <span className="text-xs text-muted-foreground truncate max-w-[240px]">{lVideoPath}</span>}
                  </div>
                  <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadVideo(e.target.files[0])} />
                  {videoProgress !== null && <div className="mt-2"><Progress value={videoProgress} /><p className="text-xs text-muted-foreground mt-1">Enviando vídeo: {videoProgress}%</p></div>}
                  <p className="mt-1 text-xs text-muted-foreground">Limite prático de upload varia (envie arquivos menores ou use YouTube para vídeos grandes).</p>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label>Thumbnail (URL, upload ou automático do YouTube)</Label>
              <div className="mt-1 flex gap-2">
                <Input value={lThumb} onChange={(e) => setLThumb(e.target.value)} placeholder="https://... (vazio = auto do YouTube)" />
                <Button type="button" variant="outline" onClick={() => thumbRef.current?.click()} disabled={thumbProgress !== null}><ImageIcon className="size-4" /></Button>
                <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadThumb(e.target.files[0])} />
              </div>
              {thumbProgress !== null && <div className="mt-2"><Progress value={thumbProgress} /><p className="text-xs text-muted-foreground mt-1">{thumbProgress}%</p></div>}
              <Button type="button" size="sm" variant="ghost" className="mt-1" onClick={() => setLThumb(youtubeThumbnail(lYoutube) || "")} disabled={!lYoutube}>Gerar thumbnail do YouTube</Button>
            </div>

            <div className="sm:col-span-2">
              <Label>Materiais anexos (opcional, um caminho/URL por linha)</Label>
              <Textarea value={lMaterials} onChange={(e) => setLMaterials(e.target.value)} rows={3} placeholder="links ou caminhos em storage..." />
              <div className="mt-1 flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => matRef.current?.click()} disabled={matProgress !== null}><Upload className="size-4" /> Upload material</Button>
                <input ref={matRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadMaterial(e.target.files[0])} />
              </div>
              {matProgress !== null && <div className="mt-2"><Progress value={matProgress} /><p className="text-xs text-muted-foreground mt-1">{matProgress}%</p></div>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonOpen(false)}>Cancelar</Button>
            <Button onClick={saveLesson} disabled={savingLesson}>{savingLesson ? "Salvando..." : "Salvar aula"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function useSessionsAdmin() {
  return useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("sessions").select("*").order("starts_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LiveSession[];
    },
  });
}

function AdminLives() {
  const qc = useQueryClient();
  const q = useSessionsAdmin();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LiveSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<SessionType>("tira_duvidas");
  const [startsAt, setStartsAt] = useState("");
  const [description, setDescription] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [replayUrl, setReplayUrl] = useState("");

  function openNew() {
    setEditing(null);
    setTitle(""); setType("tira_duvidas"); setStartsAt(""); setDescription(""); setJoinUrl(""); setReplayUrl("");
    setOpen(true);
  }
  function openEdit(s: LiveSession) {
    setEditing(s);
    setTitle(s.title);
    setType(s.type);
    setStartsAt(s.starts_at ? new Date(s.starts_at).toISOString().slice(0, 16) : "");
    setDescription(s.description || "");
    setJoinUrl(s.join_url || "");
    setReplayUrl(s.replay_url || "");
    setOpen(true);
  }
  async function save() {
    if (!title.trim() || !startsAt) { toast.error("Título e data/hora são obrigatórios."); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      type,
      starts_at: new Date(startsAt).toISOString(),
      description,
      join_url: joinUrl || null,
      replay_url: replayUrl || null,
    };
    const query = editing
      ? (supabase as any).from("sessions").update(payload).eq("id", editing.id)
      : (supabase as any).from("sessions").insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) { toast.error("Erro ao salvar sessão. Verifique se a tabela 'sessions' existe."); return; }
    toast.success(editing ? "Sessão atualizada." : "Sessão criada.");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-sessions"] });
    qc.invalidateQueries({ queryKey: ["sessions"] });
  }
  async function remove(s: LiveSession) {
    if (!confirm(`Excluir "${s.title}"?`)) return;
    const { error } = await (supabase as any).from("sessions").delete().eq("id", s.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    toast.success("Sessão excluída.");
    qc.invalidateQueries({ queryKey: ["admin-sessions"] });
    qc.invalidateQueries({ queryKey: ["sessions"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lives e Hot Seats</h2>
        <Button onClick={openNew}><Plus className="size-4" /> Nova sessão</Button>
      </div>
      {q.isLoading && <Skeleton className="mt-4 h-40 w-full rounded-2xl" />}
      {q.isError && <p className="mt-4 text-sm text-destructive">Não foi possível carregar sessões (tabela 'sessions' pode não existir).</p>}
      {q.data && (
        <div className="mt-4 space-y-3">
          {q.data.length === 0 && <p className="text-muted-foreground">Nenhuma sessão cadastrada.</p>}
          {q.data.map((s) => (
            <div key={s.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={s.type === "aula_especial" ? "default" : "secondary"}>{sessionTypeLabel(s.type)}</Badge>
                  <span className="text-sm text-muted-foreground">{formatDateTimeSP(s.starts_at)}</span>
                </div>
                <p className="mt-1 font-semibold">{s.title}</p>
                {s.join_url && <a href={s.join_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">Link <ExternalLink className="size-3" /></a>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(s)}><Pencil className="size-4" /> Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s)}><Trash2 className="size-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar sessão" : "Nova sessão"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as SessionType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SESSION_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Data e hora</Label><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></div>
            </div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
            <div><Label>Link (Meet/YouTube)</Label><Input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://..." /></div>
            <div><Label>Link do replay (opcional)</Label><Input value={replayUrl} onChange={(e) => setReplayUrl(e.target.value)} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function useProductsAdmin() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

function AdminProducts() {
  const qc = useQueryClient();
  const q = useProductsAdmin();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProductType>("ebook_pdf");
  const [price, setPrice] = useState("0");
  const [memberPrice, setMemberPrice] = useState("");
  const [filePath, setFilePath] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [active, setActive] = useState(true);

  function openNew() {
    setEditing(null);
    setName(""); setSlug(""); setDescription(""); setType("ebook_pdf"); setPrice("0"); setMemberPrice(""); setFilePath(""); setCoverUrl(""); setActive(true);
    setOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name); setSlug(p.slug); setDescription(p.description || ""); setType(p.type);
    setPrice(String(p.price_cents / 100).replace(".", ","));
    setMemberPrice(p.member_price_cents != null ? String(p.member_price_cents / 100).replace(".", ",") : "");
    setFilePath(p.file_path || ""); setCoverUrl(p.cover_url || ""); setActive(p.active);
    setOpen(true);
  }
  function toCents(v: string) {
    const n = Number(v.replace(/\./g, "").replace(",", "."));
    return Math.round((isFinite(n) ? n : 0) * 100);
  }
  async function save() {
    if (!name.trim() || !slug.trim()) { toast.error("Nome e slug são obrigatórios."); return; }
    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: slugify(slug),
      description,
      type,
      price_cents: toCents(price),
      member_price_cents: memberPrice.trim() ? toCents(memberPrice) : null,
      file_path: filePath || null,
      cover_url: coverUrl || null,
      active,
    };
    const query = editing
      ? (supabase as any).from("products").update(payload).eq("id", editing.id)
      : (supabase as any).from("products").insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) { toast.error("Erro ao salvar produto. Verifique se a tabela 'products' existe."); return; }
    toast.success(editing ? "Produto atualizado." : "Produto criado.");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }
  async function toggleActive(p: Product) {
    await (supabase as any).from("products").update({ active: !p.active }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }
  async function upload(file: File, kind: "file" | "cover") {
    setUploading(0);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${kind}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
      const bucket = kind === "cover" ? "capas" : "produtos";
      const res = await uploadWithProgress(bucket, path, file, setUploading);
    if (kind === "cover") setCoverUrl(res.path);
    else setFilePath(res.path);
      toast.success("Upload concluído.");
    } catch {
      toast.error("Falha no upload. Verifique se os buckets de produtos e capas existem.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Produtos da loja</h2>
        <Button onClick={openNew}><Plus className="size-4" /> Novo produto</Button>
      </div>
      {q.isLoading && <Skeleton className="mt-4 h-40 w-full rounded-2xl" />}
      {q.isError && <p className="mt-4 text-sm text-destructive">Não foi possível carregar produtos (tabela 'products' pode não existir).</p>}
      {q.data && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {q.data.length === 0 && <p className="text-muted-foreground">Nenhum produto cadastrado.</p>}
          {q.data.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary">{productTypeLabel(p.type)}</p>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{formatBRL(p.price_cents)} {p.member_price_cents != null ? `(assinante ${formatBRL(p.member_price_cents)})` : ""}</p>
                  <Badge variant={p.active ? "default" : "secondary"} className="mt-2">{p.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="size-4" /></Button>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>{p.active ? "Desativar" : "Ativar"}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nome</Label><Input value={name} onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as ProductType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCT_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Preço (R$)</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29,90" /></div>
            <div><Label>Preço assinante (opcional)</Label><Input value={memberPrice} onChange={(e) => setMemberPrice(e.target.value)} placeholder="19,90" /></div>
            <div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Arquivo do produto (PDF, XLSX, PPTX, HTML)</Label>
              <div className="flex gap-2">
                <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="caminho no storage (ex.: file/abc.pdf)" />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading !== null}>
                  {uploading !== null ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload
                </Button>
                <input ref={fileRef} type="file" accept=".pdf,.xlsx,.pptx,.html" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "file")} />
              </div>
              {uploading !== null && <div><Progress value={uploading} /><p className="text-xs text-muted-foreground mt-1">{uploading}%</p></div>}
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Capa (URL ou upload)</Label>
              <div className="flex gap-2">
                <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
                <Button type="button" variant="outline" onClick={() => coverRef.current?.click()} disabled={uploading !== null}><Upload className="size-4" /></Button>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />
              </div>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2"><Switch checked={active} onCheckedChange={setActive} /><Label>Ativo na loja</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || uploading !== null}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type StudentRow = {
  id: string;
  email: string | null;
  nome: string | null;
  telefone: string | null;
  created_at: string;
  aceite_termos_em: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  acesso_manual: boolean;
  is_admin: boolean;
};

function AdminStudents() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const [profilesRes, subsRes, rolesRes] = await Promise.all([
        (supabase as any).from("profiles").select("id, nome, email, telefone, created_at, aceite_termos_em").order("created_at", { ascending: false }),
        (supabase as any).from("subscriptions").select("user_id, status, current_period_end, acesso_manual"),
        (supabase as any).from("user_roles").select("user_id, role").eq("role", "admin"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (subsRes.error) throw subsRes.error;
      if (rolesRes.error) throw rolesRes.error;
      const subs = new Map<string, { status: string; current_period_end: string | null; acesso_manual: boolean }>(
        (subsRes.data ?? []).map((s: any) => [String(s.user_id), { status: String(s.status), current_period_end: s.current_period_end ?? null, acesso_manual: Boolean(s.acesso_manual) }] as const),
      );
      const admins = new Set<string>((rolesRes.data ?? []).map((r: any) => String(r.user_id)));
      const rows: StudentRow[] = (profilesRes.data ?? []).map((p: any): StudentRow => {
        const sub = subs.get(String(p.id));
        return {
          id: p.id, email: p.email, nome: p.nome, telefone: p.telefone, created_at: p.created_at, aceite_termos_em: p.aceite_termos_em,
          subscription_status: sub?.status ?? null, current_period_end: sub?.current_period_end ?? null, acesso_manual: sub?.acesso_manual ?? false, is_admin: admins.has(String(p.id)),
        };
      });
      return rows;
    },
  });
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (q.data ?? []).filter((s) => !term || s.email?.toLowerCase().includes(term) || s.nome?.toLowerCase().includes(term));
  }, [q.data, search]);

  async function grant(s: StudentRow) {
    const { error } = await (supabase as any).from("subscriptions").upsert({ user_id: s.id, status: "active", acesso_manual: true }, { onConflict: "user_id" });
    if (error) { toast.error("Não foi possível liberar o acesso."); return; }
    toast.success(`Acesso liberado para ${s.email || s.nome || "aluno"}.`);
    qc.invalidateQueries({ queryKey: ["admin-students"] });
    qc.invalidateQueries({ queryKey: ["member"] });
  }
  async function revoke(s: StudentRow) {
    if (!confirm(`Revogar o acesso de ${s.email || s.nome || "aluno"}?`)) return;
    const { error } = await (supabase as any).from("subscriptions").upsert({ user_id: s.id, status: "inactive", acesso_manual: false }, { onConflict: "user_id" });
    if (error) { toast.error("Não foi possível revogar o acesso."); return; }
    toast.success("Acesso revogado.");
    qc.invalidateQueries({ queryKey: ["admin-students"] });
    qc.invalidateQueries({ queryKey: ["member"] });
  }
  function exportCsv() {
    const rows = [
      ["email", "nome", "telefone", "status_assinatura", "acesso_manual", "admin", "criado_em", "aceite_termos_em"],
      ...filtered.map((s) => [s.email ?? "", s.nome ?? "", s.telefone ?? "", s.subscription_status ?? "", String(s.acesso_manual), String(s.is_admin), s.created_at, s.aceite_termos_em ?? ""]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `alunos-startex-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Alunos</h2>
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail" className="w-64" />
          <Button variant="outline" onClick={exportCsv}><Download className="size-4" /> CSV</Button>
        </div>
      </div>
      {q.isLoading && <Skeleton className="mt-4 h-40 w-full rounded-2xl" />}
      {q.isError && <p className="mt-4 text-sm text-destructive">Não foi possível carregar alunos.</p>}
      {q.data && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3">Aluno</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">Status</th>
                <th className="p-3">Cadastro</th>
                <th className="p-3">Admin</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3"><p className="font-medium">{s.nome || "—"}</p><p className="text-xs text-muted-foreground">{s.email || s.id}</p></td>
                  <td className="p-3">{s.telefone || "—"}</td>
                  <td className="p-3"><Badge variant={s.subscription_status === "active" || s.acesso_manual || s.is_admin ? "default" : "secondary"}>{s.is_admin ? "admin" : s.acesso_manual ? "manual" : s.subscription_status || "inactive"}</Badge></td>
                  <td className="p-3">{formatDateSP(s.created_at)}</td>
                  <td className="p-3">{s.is_admin ? "Sim" : "—"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => grant(s)}><UserCheck className="size-4" /> Liberar</Button>
                      <Button size="sm" variant="ghost" onClick={() => revoke(s)}><UserX className="size-4" /> Revogar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type AdminOrder = {
  id: string; status: string; provider: string | null; amount_cents: number | null; created_at: string; user_id: string;
  product?: { name: string | null } | null;
  profile?: { email: string | null; nome: string | null } | null;
};

function AdminOrders() {
  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("orders").select("*, product:products(name)").order("created_at", { ascending: false });
      if (error) throw error;
      const orders = (data ?? []) as AdminOrder[];
      const userIds = [...new Set(orders.map((o) => o.user_id))];
      if (userIds.length === 0) return orders;
      const { data: profiles, error: profilesError } = await (supabase as any).from("profiles").select("id, email, nome").in("id", userIds);
      if (profilesError) throw profilesError;
      const byId = new Map<string, NonNullable<AdminOrder["profile"]>>(
        (profiles ?? []).map((p: any) => [p.id, p]),
      );
      return orders.map((o) => ({ ...o, profile: byId.get(o.user_id) ?? null })) as AdminOrder[];
    },
  });

  function exportCsv() {
    const rows = [
      ["data", "aluno", "email", "produto", "valor", "status", "provedor"],
      ...(q.data ?? []).map((o) => [o.created_at, o.profile?.nome ?? "", o.profile?.email ?? "", o.product?.name ?? "", o.amount_cents != null ? (o.amount_cents / 100).toFixed(2) : "", o.status, o.provider ?? ""]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vendas-startex-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Vendas</h2>
        <Button variant="outline" onClick={exportCsv}><Download className="size-4" /> CSV</Button>
      </div>
      {q.isLoading && <Skeleton className="mt-4 h-40 w-full rounded-2xl" />}
      {q.isError && <p className="mt-4 text-sm text-destructive">Tabela de pedidos não encontrada ou sem permissão.</p>}
      {q.data && q.data.length === 0 && <p className="mt-4 text-muted-foreground">Nenhuma venda registrada.</p>}
      {q.data && q.data.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left"><tr><th className="p-3">Data</th><th className="p-3">Aluno</th><th className="p-3">Produto</th><th className="p-3">Valor</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {q.data.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3">{formatDateTimeSP(o.created_at)}</td>
                  <td className="p-3"><p>{o.profile?.nome || "—"}</p><p className="text-xs text-muted-foreground">{o.profile?.email || o.user_id}</p></td>
                  <td className="p-3">{o.product?.name || "—"}</td>
                  <td className="p-3">{o.amount_cents != null ? formatBRL(o.amount_cents) : "—"}</td>
                  <td className="p-3"><Badge variant={o.status === "paid" ? "default" : "secondary"}>{o.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
