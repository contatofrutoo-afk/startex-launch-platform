import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ComingSoon } from "@/components/app/ComingSoon";
import { PageContainer } from "@/components/app/AppShell";
import { useMember } from "@/hooks/use-member";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Startex" },
      { name: "description", content: "Painel de administração da Startex." },
      { property: "og:title", content: "Admin — Startex" },
      { property: "og:description", content: "Painel de administração da Startex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data, isLoading } = useMember();
  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-48" />
      </PageContainer>
    );
  }
  if (!data?.isAdmin) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md py-16 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <p className="mt-4 font-display text-xl font-semibold">Acesso restrito</p>
          <p className="mt-1 text-muted-foreground">Esta área é exclusiva para administradores.</p>
          <Button asChild className="mt-6">
            <Link to="/trilhas">Voltar para as trilhas</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }
  return (
    <ComingSoon title="Admin">
      O painel para gerenciar aulas, lives, produtos, alunos e vendas chega na próxima etapa.
    </ComingSoon>
  );
}
