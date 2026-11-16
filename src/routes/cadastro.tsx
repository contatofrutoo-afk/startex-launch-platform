import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout, FieldError } from "@/components/site/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { maskPhoneBR } from "@/lib/format";
import { fieldErrors, signupSchema, PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { authErrorMessage } from "@/lib/auth-errors";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Startex" },
      { name: "description", content: "Cadastre-se na Startex e acesse as trilhas de aulas para empreendedores." },
      { property: "og:title", content: "Criar conta — Startex" },
      { property: "og:description", content: "Cadastre-se na área de membros Startex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", senha: "", aceite: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    const { nome, email, telefone, senha } = parsed.data;
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/trilhas`,
        data: { nome, telefone, aceite_termos: "true" },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    if (!data.session) {
      toast.success("Conta criada! Confira seu e-mail para confirmar o cadastro.");
      return;
    }
    toast.success("Conta criada! Boas-vindas à Startex.");
    navigate({ to: "/trilhas", replace: true });
  }

  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Leva menos de um minuto."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/entrar" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            autoComplete="name"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="mt-1.5"
          />
          <FieldError message={errors.nome} />
        </div>
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
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="(11) 91234-5678"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: maskPhoneBR(e.target.value) })}
            className="mt-1.5"
          />
          <FieldError message={errors.telefone} />
        </div>
        <div>
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="new-password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">Mínimo de {PASSWORD_MIN_LENGTH} caracteres.</p>
          <FieldError message={errors.senha} />
        </div>
        <div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="aceite"
              checked={form.aceite}
              onCheckedChange={(v) => setForm({ ...form, aceite: v === true })}
              className="mt-0.5"
            />
            <Label htmlFor="aceite" className="text-sm font-normal leading-snug text-muted-foreground">
              Li e aceito os{" "}
              <Link to="/termos" target="_blank" className="text-primary hover:underline">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link to="/privacidade" target="_blank" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
              .
            </Label>
          </div>
          <FieldError message={errors.aceite} />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Criar conta
        </Button>
      </form>
    </AuthLayout>
  );
}
