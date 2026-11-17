import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs space-y-3">
          <Logo variant="stacked" className="w-32" />
          <p className="text-sm text-muted-foreground">
            Educação para donos de pequenos negócios e MEIs.
          </p>
        </div>
        <nav className="grid gap-2 text-sm">
          <span className="font-display font-semibold text-foreground">Institucional</span>
          <Link to="/termos" className="text-muted-foreground hover:text-foreground">
            Termos de Uso
          </Link>
          <Link to="/privacidade" className="text-muted-foreground hover:text-foreground">
            Política de Privacidade
          </Link>
          <Link to="/admin/entrar" className="text-muted-foreground hover:text-foreground">
            Acesso administrativo
          </Link>
        </nav>
        <div className="grid gap-2 text-sm">
          <span className="font-display font-semibold text-foreground">Contato</span>
          <a href="mailto:contato@startex.com.br" className="text-muted-foreground hover:text-foreground">
            contato@startex.com.br
          </a>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Startex. Todos os direitos reservados.
      </div>
    </footer>
  );
}
