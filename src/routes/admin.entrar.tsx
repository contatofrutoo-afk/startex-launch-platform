import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, FieldError } from "@/components/site/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { fieldErrors, loginSchema, safeRedirect } from "@/lib/validation";
import { authErrorMessage } from "@/lib/auth-errors";
import { ADMIN_OWNER_EMAIL } from "@/lib/owner";
import { memberQueryKey } from "@/hooks/use-member";

export const Route = createFileRoute("/admin/entrar")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Acesso administrativo — Startex" },
      { name: "description", content: "Área restrita da equipe Startex." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminEntrarPage,
});

function AdminEntrarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { redirect } = Route.useSearch();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.senha,
    });

    if (error) {
      setLoading(false);
      toast.error(authErrorMessage(error));
      return;
    }

    const user = data.user;
    const email = (user?.email ?? "").trim().toLowerCase();
    let isAdmin = email === ADMIN_OWNER_EMAIL.toLowerCase();

    if (user && !isAdmin) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      isAdmin = (roles ?? []).some((role) => role.role === "admin");
    }

    setLoading(false);

    if (!isAdmin) {
      await supabase.auth.signOut();
      queryClient.removeQueries({ queryKey: memberQueryKey });
      toast.error("Esta conta não tem acesso de administrador.");
      return;
    }

    await queryClient.invalidateQueries();
    toast.success("Acesso liberado.");
    navigate({ href: safeRedirect(redirect, "/admin"), replace: true });
  }

  return (
    <AuthLayout
      title="Acesso administrativo"
      subtitle="Área restrita da equipe Startex. Entre com seu e-mail e senha de administrador."
      footer={
        <Link to="/" className="font-semibold text-primary hover:underline">
          Voltar ao site
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5"
          />
          <FieldError message={errors["email"]} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
            <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            className="mt-1.5"
          />
          <FieldError message={errors["senha"]} />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Entrar como administrador
        </Button>
      </form>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" />
        Acesso monitorado e exclusivo para administradores.
      </p>
    </AuthLayout>
  );
}
