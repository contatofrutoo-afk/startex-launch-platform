import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { useSessionUser } from "@/hooks/use-member";

export function SiteHeader() {
  const { data: user } = useSessionUser();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="Startex — início">
          <Logo className="h-7 sm:h-8" />
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="hero" size="sm">
              <Link to="/trilhas">Minhas trilhas</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/entrar">Entrar</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
