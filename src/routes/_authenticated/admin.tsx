import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Download,
  ExternalLink,
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageContainer } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/hooks/use-member";
import { formatBRL, formatDateTimeSP } from "@/lib/format";
import { SESSION_TYPE_LABEL, sessionTypeLabel, type LiveSession, type SessionType } from "@/lib/sessions";
import { PRODUCT_TYPE_LABEL, effectivePriceCents, productTypeLabel, type Product, type ProductType } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Startex" },
      { name: "description", content: "Painel administrativo da plataforma Startex." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AdminTab = "lives" | "loja" | "alunos" | "vendas";

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
      <p className="mt-2 text-muted-foreground">Gerencie lives, produtos, alunos e vendas.</p>
      <Tabs defaultValue="lives" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="lives">
            <Radio className="mr-2 size-4" /> Lives
          </TabsTrigger>
          <TabsTrigger value="loja">
            <ShoppingBag className="mr-2 size-4" /> Loja
          </TabsTrigger>
          <TabsTrigger value="alunos">
            <Users className="mr-2 size-4" /> Alunos
          </TabsTrigger>
          <TabsTrigger value="vendas">
            <Download className="mr-2 size-4" /> Vendas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lives" className="mt-6">
          <AdminLives />
        </TabsContent>
        <TabsContent value="loja" className="mt-6">
          <AdminProducts />
        </TabsContent>
        <TabsContent value="alunos" className="mt-6">
          <AdminStudents />
        </TabsContent>
        <TabsContent value="vendas" className="mt-6">
          <AdminOrders />
        </TabsContent>
      </Tabs>
    </PageContainer>
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
  const [type, setType] = useState<SessionType>("hot_seat");
  const [startsAt, setStartsAt] = useState("");
  const [description, setDescription] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [replayUrl, setReplayUrl] = useState("");

  function reset() {
    setEditing(null);
    setTitle("");
    setType("hot_seat");
    setStartsAt("");
    setDescription("");
    setJoinUrl("");
    setReplayUrl("");
  }

  function openNew() {
    reset();
    setOpen(true);
  }

  function openEdit(s: LiveSession) {
    setEditing(s);
    setTitle(s.title);
    setType(s.type);
    setStartsAt(s.starts_at ? new Date(s.starts_at).toISOString().slice(0, 16) : "");
    setDescription(s.description ?? "");
    setJoinUrl(s.join_url ?? "");
    setReplayUrl(s.replay_url ?? "");
    setOpen(true);
  }

  async function save() {
    if (!title.trim() || !startsAt) {
      toast.error("Preencha título e data/hora.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        type,
        starts_at: new Date(startsAt).toISOString(),
        description: description.trim() || null,
        join_url: joinUrl.trim() || null,
        replay_url: replayUrl.trim() || null,
      };
      const { error } = editing
        ? await (supabase as any).from("sessions").update(payload).eq("id", editing.id)
        : await (supabase as any).from("sessions").insert(payload);
      if (error) throw error;
      toast.success(editing ? "Sessão atualizada." : "Sessão criada.");
      setOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["admin-sessions"] });
    } catch (e) {
      toast.error("Não foi possível salvar. Verifique se a tabela de sessões existe.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: LiveSession) {
    if (!confirm(`Excluir a sessão "${s.title}"?`)) return;
    const { error } = await (supabase as any).from("sessions").delete().eq("id", s.id);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    toast.success("Sessão excluída.");
    qc.invalidateQueries({ queryKey: ["sessions"] });
    qc.invalidateQueries({ queryKey: ["admin-sessions"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lives e Hot Seats</h2>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Nova sessão
        </Button>
      </div>
      {q.isLoading && <Skeleton className="mt-4 h-40 w-full rounded-2xl" />}
      {q.isError && <p className="mt-4 text-sm text-destructive">Tabela de sessões não encontrada ou sem permissão.</p>}
      {q.data && q.data.length === 0 && <p className="mt-4 text-muted-foreground">Nenhuma sessão cadastrada.</p>}
      {q.data && q.data.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3">Título</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Data</th>
                <th className="p-3">Links</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3 font-medium">{s.title}</td>
                  <td className="p-3">{sessionTypeLabel(s.type)}</td>
                  <td className="p-3">{formatDateTimeSP(s.starts_at)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {s.join_url && (
                        <a href={s.join_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Entrar
                        </a>
                      )}
                      {s.replay_url && (
                        <a href={s.replay_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Replay
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)} aria-label="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(s)} aria-label="Excluir">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar sessão" : "Nova sessão"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hot Seat com..." />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as SessionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SESSION_TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data e hora (local)</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">Será salvo em UTC e exibido em horário de Brasília.</p>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Link para entrar (opcional)</Label>
              <Input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Link do replay (opcional)</Label>
              <Input value={replayUrl} onChange={(e) => setReplayUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null} Salvar
            </Button>
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

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function AdminProducts() {
  const qc = useQueryClient();
  const q = useProductsAdmin();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [memberPrice, setMemberPrice] = useState("");
  const [ptype, setPtype] = useState<ProductType>("ebook_pdf");
  const [filePath, setFilePath] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [active, setActive] = useState(true);

  function reset() {
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setPrice("");
    setMemberPrice("");
    setPtype("ebook_pdf");
    setFilePath("");
    setCoverUrl("");
    setActive(true);
  }

  function openNew() {
    reset();
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description ?? "");
    setPrice((p.price_cents / 100).toFixed(2));
    setMemberPrice(p.member_price_cents ? (p.member_price_cents / 100).toFixed(2) : "");
    setPtype(p.type);
    setFilePath(p.file_path ?? "");
    setCoverUrl(p.cover_url ?? "");
    setActive(p.active);
    setOpen(true);
  }

  async function upload(file: File, kind: "file" | "cover") {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${kind}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
      const bucket = kind === "cover" ? "produtos" : "produtos";
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      if (kind === "cover") {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        setCoverUrl(data.publicUrl);
      } else {
        setFilePath(path);
      }
      toast.success("Upload concluído.");
    } catch {
      toast.error("Falha no upload. Verifique se o bucket de produtos existe.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!name.trim() || !price) {
      toast.error("Preencha nome e preço.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: (slug || slugify(name)).trim(),
        description: description.trim() || null,
        price_cents: Math.round(Number(price.replace(",", ".")) * 100),
        member_price_cents: memberPrice ? Math.round(Number(memberPrice.replace(",", ".")) * 100) : null,
        type: ptype,
        file_path: filePath || null,
        cover_url: coverUrl || null,
        active,
      };
      const { error } = editing
        ? await (supabase as any).from("products").update(payload).eq("id", editing.id)
        : await (supabase as any).from("products").insert(payload);
      if (error) throw error;
      toast.success(editing ? "Produto atualizado." : "Produto criado.");
      setOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch {
      toast.error("Não foi possível salvar. Verifique se a tabela de produtos existe.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Excluir o produto "${p.name}"?`)) return;
    const { error } = await (supabase as any).from("products").delete().eq("id", p.id);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    toast.success("Produto excluído.");
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Loja</h2>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Novo produto
        </Button>
      </div>
      {q.isLoading && <Skeleton className="mt-4 h-40 w-full rounded-2xl" />}
      {q.isError && <p className="mt-4 text-sm text-destructive">Tabela de produtos não encontrada ou sem permissão.</p>}
      {q.data && q.data.length === 0 && <p className="mt-4 text-muted-foreground">Nenhum produto cadastrado.</p>}
      {q.data && q.data.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((p) => (
            <article key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface-raised">
                {p.cover_url ? <img src={p.cover_url} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary">{productTypeLabel(p.type)}</p>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm">{formatBRL(effectivePriceCents(p, false))}</p>
                  {p.member_price_cents != null && (
                    <p className="text-xs text-muted-foreground">Assinante: {formatBRL(p.member_price_cents)}</p>
                  )}
                </div>
                <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Ativo" : "Inativo"}</Badge>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)} aria-label="Editar">
                  <Pencil className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(p)} aria-label="Excluir">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editing) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="meu-produto" />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço (R$)</Label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="197,00" />
              </div>
              <div>
                <Label>Preço assinante (opcional)</Label>
                <Input value={memberPrice} onChange={(e) => setMemberPrice(e.target.value)} placeholder="97,00" />
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={ptype} onValueChange={(v) => setPtype(v as ProductType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCT_TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo do produto</Label>
              <div className="flex gap-2">
                <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="ebook/arquivo.pdf" />
                <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "file")}
              />
            </div>
            <div>
              <Label>Capa</Label>
              <div className="flex gap-2">
                <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
                <Button variant="outline" onClick={() => coverRef.current?.click()} disabled={uploading}>
                  <Upload className="size-4" />
                </Button>
              </div>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Produto ativo na loja
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || uploading}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type StudentRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_status: string | null;
  is_admin?: boolean | null;
  created_at: string;
};

function AdminStudents() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentRow[];
    },
  });
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return (q.data ?? []).filter(
      (s) =>
        !term ||
        s.email?.toLowerCase().includes(term) ||
        s.full_name?.toLowerCase().includes(term),
    );
  }, [q.data, search]);

  async function grant(s: StudentRow) {
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ subscription_status: "active" })
      .eq("id", s.id);
    if (error) {
      toast.error("Não foi possível liberar o acesso.");
      return;
    }
    toast.success(`Acesso liberado para ${s.email ?? s.full_name ?? "aluno"}.`);
    qc.invalidateQueries({ queryKey: ["admin-students"] });
  }

  async function revoke(s: StudentRow) {
    if (!confirm(`Revogar o acesso de ${s.email ?? s.full_name ?? "aluno"}?`)) return;
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ subscription_status: "inactive" })
      .eq("id", s.id);
    if (error) {
      toast.error("Não foi possível revogar o acesso.");
      return;
    }
    toast.success("Acesso revogado.");
    qc.invalidateQueries({ queryKey: ["admin-students"] });
  }

  function exportCsv() {
    const rows = [
      ["email", "nome", "status_assinatura", "admin", "criado_em"],
      ...filtered.map((s) => [s.email ?? "", s.full_name ?? "", s.subscription_status ?? "", String(!!s.is_admin), s.created_at]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alunos-startex-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Alunos</h2>
          <p className="text-sm text-muted-foreground">Libere/revogue acesso manualmente e exporte a base.</p>
        </div>
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar e-mail/nome" className="w-56" />
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> CSV
          </Button>
        </div>
      </div>
      {q.isLoading && <Skeleton className="mt-4 h-40 w-full rounded-2xl" />}
      {q.isError && <p className="mt-4 text-sm text-destructive">Tabela de perfis não encontrada ou sem permissão.</p>}
      {filtered.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3">Aluno</th>
                <th className="p-3">Status</th>
                <th className="p-3">Admin</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3">
                    <p className="font-medium">{s.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.email || s.id}</p>
                  </td>
                  <td className="p-3">
                    <Badge variant={s.subscription_status === "active" ? "default" : "secondary"}>
                      {s.subscription_status || "inactive"}
                    </Badge>
                  </td>
                  <td className="p-3">{s.is_admin ? "Sim" : "—"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => grant(s)}>
                        <UserCheck className="size-4" /> Liberar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => revoke(s)}>
                        <UserX className="size-4" /> Revogar
                      </Button>
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
  id: string;
  status: string;
  provider: string | null;
  amount_cents: number | null;
  created_at: string;
  user_id: string;
  product?: { name: string | null } | null;
  profile?: { email: string | null; full_name: string | null } | null;
};

function AdminOrders() {
  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("*, product:products(name), profile:profiles(email, full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminOrder[];
    },
  });

  function exportCsv() {
    const rows = [
      ["data", "aluno", "email", "produto", "valor", "status", "provedor"],
      ...(q.data ?? []).map((o) => [
        o.created_at,
        o.profile?.full_name ?? "",
        o.profile?.email ?? "",
        o.product?.name ?? "",
        o.amount_cents != null ? (o.amount_cents / 100).toFixed(2) : "",
        o.status,
        o.provider ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas-startex-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Vendas</h2>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" /> CSV
        </Button>
      </div>
      {q.isLoading && <Skeleton className="mt-4 h-40 w-full rounded-2xl" />}
      {q.isError && <p className="mt-4 text-sm text-destructive">Tabela de pedidos não encontrada ou sem permissão.</p>}
      {q.data && q.data.length === 0 && <p className="mt-4 text-muted-foreground">Nenhuma venda registrada.</p>}
      {q.data && q.data.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Aluno</th>
                <th className="p-3">Produto</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3">{formatDateTimeSP(o.created_at)}</td>
                  <td className="p-3">
                    <p>{o.profile?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{o.profile?.email || o.user_id}</p>
                  </td>
                  <td className="p-3">{o.product?.name || "—"}</td>
                  <td className="p-3">{o.amount_cents != null ? formatBRL(o.amount_cents) : "—"}</td>
                  <td className="p-3">
                    <Badge variant={o.status === "paid" ? "default" : "secondary"}>{o.status}</Badge>
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
