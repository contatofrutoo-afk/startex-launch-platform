import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clapperboard,
  LogOut,
  Menu,
  Package,
  Radio,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/Logo";
import { useMember } from "@/hooks/use-member";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/trilhas", label: "Trilhas", icon: Clapperboard },
  { to: "/lives", label: "Lives e Hot Seats", icon: Radio },
  { to: "/loja", label: "Loja", icon: ShoppingBag },
  { to: "/meus-produtos", label: "Meus produtos", icon: Package },
  { to: "/minha-conta", label: "Minha conta", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: member } = useMember();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/entrar", replace: true });
  }

  const linkClass =
    "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
          <Link to="/trilhas" aria-label="Startex — trilhas">
            <Logo className="h-7 sm:h-8" />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-6!" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-border bg-surface">
              <SheetHeader>
                <SheetTitle className="text-left font-display">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1">
                {NAV.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={linkClass}
                    activeProps={{ className: "bg-secondary text-foreground" }}
                  >
                    <Icon className="size-5 text-primary" /> {label}
                  </Link>
                ))}
                {member?.isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className={linkClass}
                    activeProps={{ className: "bg-secondary text-foreground" }}
                  >
                    <ShieldCheck className="size-5 text-brand-blue" /> Admin
                  </Link>
                )}
                <button onClick={handleSignOut} className={linkClass}>
                  <LogOut className="size-5" /> Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 sm:py-10">{children}</div>;
}
