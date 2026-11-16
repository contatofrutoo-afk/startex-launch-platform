import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/lives")({
  head: () => ({
    meta: [
      { title: "Lives e Hot Seats — Startex" },
      { name: "description", content: "Agenda de lives de tira-dúvidas, Hot Seats e aulas especiais da Startex." },
      { property: "og:title", content: "Lives e Hot Seats — Startex" },
      { property: "og:description", content: "Agenda de lives de tira-dúvidas, Hot Seats e aulas especiais da Startex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ComingSoon title="Lives e Hot Seats">
      A agenda de lives, Hot Seats e aulas especiais, com link de acesso e replay, chega na próxima etapa.
    </ComingSoon>
  ),
});
