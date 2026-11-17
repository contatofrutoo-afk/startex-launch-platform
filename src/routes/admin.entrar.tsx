import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, FieldError } from "@/components/site/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { fieldErrors, loginSchema, PASSWORD_MIN_LENGTH, safeRedirect } from "@/lib/validation";
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

const adminSignupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email({ message: "Informe um e-mail válido." })
      .max(255, { message: "E-mail muito longo." }),
    senha: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { message: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` })
      .max(72, { message: "A senha deve ter no máximo 72 caracteres." }),
    confirmar: z.string(),
  })
  .refine((v) => v.senha === v.confirmar, { message: "As senhas não conferem.", path: ["confirmar"] });

async function userIsAdmin(user: { id: string; email?: string | null } | null): Promise<boolean> {
  if (!user) return false;
  const email = (user.email ?? "").trim().toLowerCase();
  if (email === ADMIN_OWNER_EMAIL.toLowerCase()) return true;
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  return (roles ?? []).some((role) => role.role === "admin");
}

function AdminEntrarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ email: "", senha: "", confirmar: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setErrors({});
  }

  async function onLogin(e: FormEvent) {
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

    const isAdmin = await userIsAdmin(data.user);
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

  async function onSignup(e: FormEvent) {
    e.preventDefault();
    const parsed = adminSignupSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    if (parsed.data.email.toLowerCase() !== ADMIN_OWNER_EMAIL.toLowerCase()) {
      setErrors({ email: "Use o e-mail de proprietário para criar a conta de administrador." });
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { nome: "", telefone: "", aceite_termos: "true" },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(authErrorMessage(error));
      return;
    }

    if (!data.session) {
      setLoading(false);
      toast.success("Conta criada. Verifique seu e-mail para confirmar e depois entre.");
      switchMode("login");
      return;
    }

    const isAdmin = await userIsAdmin(data.user);
    setLoading(false);

    if (!isAdmin) {
      await supabase.auth.signOut();
      queryClient.removeQueries({ queryKey: memberQueryKey });
      toast.error("Esta conta não tem acesso de administrador.");
      return;
    }

    await queryClient.invalidateQueries();
    toast.success("Conta de administrador criada. Acesso liberado.");
    navigate({ href: safeRedirect(redirect, "/admin"), replace: true });
  }

  return (
    <AuthLayout
      title="Acesso administrativo"
      subtitle={
        isSignup
          ? "Crie a conta de administrador com o e-mail de proprietário."
          : "Área restrita da equipe Startex. Entre com seu e-mail e senha de administrador."
      }
      footer={
        <>
          {isSignup ? (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-primary hover:underline"
              >
                Entrar
              </button>
            </>
          ) : (
            <>
              Primeiro acesso?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-semibold text-primary hover:underline"
              >
                Criar conta de administrador
              </button>
            </>
          )}
          <span className="mx-2">·</span>
          <Link to="/" className="font-semibold text-primary hover:underline">
            Voltar ao site
          </Link>
        </>
      }
    >
      <form onSubmit={isSignup ? onSignup : onLogin} className="space-y-4" noValidate>
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
            {!isSignup && (
              <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </Link>
            )}
          </div>
          <Input
            id="senha"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            className="mt-1.5"
          />
          {isSignup && (
            <p className="mt-1 text-xs text-muted-foreground">
              Mínimo de {PASSWORD_MIN_LENGTH} caracteres.
            </p>
          )}
          <FieldError message={errors["senha"]} />
        </div>
        {isSignup && (
          <div>
            <Label htmlFor="confirmar">Confirmar senha</Label>
            <Input
              id="confirmar"
              type="password"
              autoComplete="new-password"
              value={form.confirmar}
              onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
              className="mt-1.5"
            />
            <FieldError message={errors["confirmar"]} />
          </div>
        )}
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}{" "}
          {isSignup ? "Criar conta e entrar" : "Entrar como administrador"}
        </Button>
      </form>
      {isSignup && (
        <p className="mt-4 text-xs text-muted-foreground">
          A conta será criada com o e-mail de proprietário e já terá acesso administrativo.
        </p>
      )}
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" />
        Acesso monitorado e exclusivo para administradores.
      </p>
    </AuthLayout>
  );
}
