import type { ReactNode } from "react";
import { Construction } from "lucide-react";
import { PageContainer } from "@/components/app/AppShell";

export function ComingSoon({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      <div className="mt-8 flex max-w-xl flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-surface p-8">
        <Construction className="size-8 text-primary" />
        <p className="font-display text-lg font-semibold">Em construção</p>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </PageContainer>
  );
}
