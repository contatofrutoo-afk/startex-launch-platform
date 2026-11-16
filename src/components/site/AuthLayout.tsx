import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-0 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-brand opacity-15 blur-3xl" />
      <Link to="/" className="relative mb-8" aria-label="Startex — início">
        <Logo variant="stacked" className="w-36" />
      </Link>
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="relative mt-6 text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-destructive">{message}</p>;
}
