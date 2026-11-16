import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/loja")({
  head: () => ({
    meta: [
      { title: "Loja — Startex" },
      { name: "description", content: "Ebooks, planilhas, apresentações e ferramentas online para empreendedores." },
      { property: "og:title", content: "Loja — Startex" },
      { property: "og:description", content: "Ebooks, planilhas, apresentações e ferramentas online para empreendedores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ComingSoon title="Loja">
      A loja de ebooks, planilhas, apresentações e ferramentas online chega na próxima etapa.
    </ComingSoon>
  ),
});
