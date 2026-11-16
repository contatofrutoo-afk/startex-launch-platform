import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/app/AppShell";
import { SubscribeButton } from "@/components/app/SubscribeButton";
import { FieldError } from "@/components/site/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { memberQueryKey, useMember, type Member } from "@/hooks/use-member";
import { formatDateSP, formatDateTimeSP, maskPhoneBR } from "@/lib/format";
import { fieldErrors } from "@/lib/validation";

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
});

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
  const [form, setForm] = useState({ nome: "", telefone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) setForm({ nome: member.nome, telefone: maskPhoneBR(member.telefone) });
  }, [member]);

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
    const { error } = await supabase
      .from("profiles")
      .update({ nome: parsed.data.nome, telefone: parsed.data.telefone })
      .eq("id", member.userId);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }
    toast.success("Dados atualizados.");
    queryClient.invalidateQueries({ queryKey: memberQueryKey });
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
            {!member.hasAccess && <SubscribeButton className="mt-4" />}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Seus dados</h2>
            <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-1.5" />
                <FieldError message={errors.nome} />
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
                <FieldError message={errors.telefone} />
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
