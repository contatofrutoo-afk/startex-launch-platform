import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, FieldError } from "@/components/site/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { fieldErrors, loginSchema, safeRedirect } from "@/lib/validation";
import { authErrorMessage } from "@/lib/auth-errors";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Startex" },
      { name: "description", content: "Acesse sua área de membros Startex." },
      { property: "og:title", content: "Entrar — Startex" },
      { property: "og:description", content: "Acesse sua área de membros Startex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
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
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.senha,
    });
    setLoading(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    navigate({ href: safeRedirect(redirect), replace: true });
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Boas-vindas de volta."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-primary hover:underline">
            Cadastrar
          </Link>
        </>
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
          <FieldError message={errors.email} />
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
          <FieldError message={errors.senha} />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
