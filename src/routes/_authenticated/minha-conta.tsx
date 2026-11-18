import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, CreditCard, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/app/AppShell";
import { SubscribeButton } from "@/components/app/SubscribeButton";
import { FieldError } from "@/components/site/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { memberQueryKey, useMember, type Member } from "@/hooks/use-member";
import { initials } from "@/lib/community";
import { formatDateSP, formatDateTimeSP, maskPhoneBR } from "@/lib/format";
import { fieldErrors } from "@/lib/validation";
import { getPaymentAdapter } from "@/lib/payments";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Startex" },
      { name: "description", content: "Seus dados e sua assinatura Startex." },
      { property: "og:title", content: "Minha conta — Startex" },
      { property: "og:description", content: "Seus dados e sua assinatura Startex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MinhaContaPage,
});

const profileSchema = z.object({
  nome: z.string().trim().min(3, { message: "Informe seu nome completo." }).max(120),
  telefone: z.string().refine((v) => [10, 11].includes(v.replace(/\D/g, "").length), {
    message: "Informe um telefone com DDD.",
  }),
  cidade: z.string().trim().max(80, { message: "A cidade deve ter no máximo 80 caracteres." }),
  estado: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[A-Za-z]{2}$/.test(v), {
      message: "Use a sigla com 2 letras (ex.: SP).",
    }),
});

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function subscriptionLabel(m: Member): string {
  if (m.isAdmin) return "Administrador — acesso total";
  if (m.subscription?.acesso_manual) return "Acesso liberado pela equipe";
  if (m.hasAccess) {
    return m.subscription?.current_period_end
      ? `Ativa até ${formatDateSP(m.subscription.current_period_end)}`
      : "Ativa";
  }
  return "Sem assinatura ativa";
}

function MinhaContaPage() {
  const { data: member, isLoading } = useMember();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ nome: "", telefone: "", cidade: "", estado: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!member || initializedFor.current === member.userId) return;
    initializedFor.current = member.userId;
    setForm({
      nome: member.nome,
      telefone: maskPhoneBR(member.telefone),
      cidade: member.cidade,
      estado: member.estado,
    });
    setAvatarPreview(member.avatarUrl || null);
  }, [member]);

  async function removeStoredAvatar(url: string | null) {
    if (!url) return;
    const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
    if (!url.includes(marker)) return;
    const path = url.split(marker)[1]?.split("?")[0];
    if (!path) return;
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  }

  async function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !member) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error("Escolha uma imagem JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("A imagem deve ter no máximo 2 MB.");
      return;
    }

    setAvatarUploading(true);
    try {
      const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
      const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(rawExt) ? rawExt : "jpg";
      const path = `${member.userId}/avatar-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError || !uploadData) throw uploadError ?? new Error("Falha no upload.");

      const { data: publicData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(uploadData.path);
      const publicUrl = publicData.publicUrl;
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", member.userId);
      if (updateError) throw updateError;

      await removeStoredAvatar(avatarPreview);
      setAvatarPreview(publicUrl);
      queryClient.invalidateQueries({ queryKey: memberQueryKey });
      queryClient.invalidateQueries({ queryKey: ["community"] });
      toast.success("Foto atualizada.");
    } catch {
      toast.error("Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function removeAvatar() {
    if (!member) return;
    setAvatarUploading(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ avatar_url: "" })
        .eq("id", member.userId);
      if (error) throw error;

      await removeStoredAvatar(avatarPreview);
      setAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: memberQueryKey });
      queryClient.invalidateQueries({ queryKey: ["community"] });
      toast.success("Foto removida.");
    } catch {
      toast.error("Não foi possível remover a foto.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!member) return;
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSaving(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        nome: parsed.data.nome,
        telefone: parsed.data.telefone,
        cidade: parsed.data.cidade,
        estado: parsed.data.estado.toUpperCase(),
      })
      .eq("id", member.userId);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }
    toast.success("Dados atualizados.");
    queryClient.invalidateQueries({ queryKey: memberQueryKey });
    queryClient.invalidateQueries({ queryKey: ["community"] });
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const adapter = getPaymentAdapter();
      if (!adapter.openCustomerPortal) return;
      const res = await adapter.openCustomerPortal(`${window.location.origin}/minha-conta`);
      if ("unavailable" in res) toast.info(res.message);
      else window.location.href = res.url;
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold sm:text-4xl">Minha conta</h1>
      {isLoading || !member ? (
        <div className="mt-8 grid max-w-3xl gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : (
        <div className="mt-8 grid max-w-3xl gap-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Assinatura</h2>
            <p className="mt-2 text-muted-foreground">{subscriptionLabel(member)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!member.hasAccess && <SubscribeButton />}
              {member.subscription && !member.subscription.acesso_manual && (
                <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
                  <CreditCard className="size-4" />{" "}
                  {portalLoading ? "Abrindo..." : "Gerenciar/cancelar assinatura (portal Stripe)"}
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Cancelamento e atualização de cartão via Portal do Cliente Stripe (quando
              configurado). Cancele quando quiser; acesso até o fim do período pago.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Seus dados</h2>
            <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
              <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                <Avatar className="size-20 border-2 border-primary/20">
                  {avatarPreview ? <AvatarImage src={avatarPreview} alt={member.nome} /> : null}
                  <AvatarFallback className="text-xl font-semibold">
                    {initials(member.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Foto do perfil</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WEBP ou GIF, até 2 MB. A foto aparece na comunidade.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Camera className="size-4" />
                      )}
                      {avatarPreview ? "Trocar foto" : "Enviar foto"}
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeAvatar}
                        disabled={avatarUploading}
                      >
                        <Trash2 className="size-4" /> Remover
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={AVATAR_TYPES.join(",")}
                    className="hidden"
                    onChange={onAvatarChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  maxLength={120}
                  className="mt-1.5"
                />
                <FieldError message={errors["nome"]} />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  inputMode="numeric"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: maskPhoneBR(e.target.value) })}
                  className="mt-1.5"
                />
                <FieldError message={errors["telefone"]} />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  placeholder="Ex.: São Paulo"
                  maxLength={80}
                  className="mt-1.5"
                />
                <FieldError message={errors["cidade"]} />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={form.estado}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estado: e.target.value
                        .replace(/[^a-zA-Z]/g, "")
                        .slice(0, 2)
                        .toUpperCase(),
                    })
                  }
                  placeholder="UF"
                  maxLength={2}
                  className="mt-1.5 uppercase"
                />
                <FieldError message={errors["estado"]} />
              </div>
              <div className="sm:col-span-2">
                <Label>E-mail</Label>
                <p className="mt-1.5 text-muted-foreground">{member.email}</p>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />} Salvar alterações
                </Button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <p>Cadastro em {formatDateSP(member.criadoEm)}.</p>
            <p className="mt-1">
              {member.aceiteTermosEm
                ? `Termos de Uso e Política de Privacidade aceitos em ${formatDateTimeSP(member.aceiteTermosEm)}.`
                : "Aceite dos Termos não registrado."}
            </p>
          </section>
        </div>
      )}
    </PageContainer>
  );
}
