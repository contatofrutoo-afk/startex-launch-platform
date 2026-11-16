import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/meus-produtos")({
  head: () => ({
    meta: [
      { title: "Meus produtos — Startex" },
      { name: "description", content: "Seus ebooks, planilhas e ferramentas comprados na Startex." },
      { property: "og:title", content: "Meus produtos — Startex" },
      { property: "og:description", content: "Seus ebooks, planilhas e ferramentas comprados na Startex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ComingSoon title="Meus produtos">
      Aqui você vai encontrar tudo o que comprar na loja, para baixar ou abrir.
    </ComingSoon>
  ),
});
