import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { SUBSCRIPTION_PRICE_CENTS, formatBRL } from "@/lib/format";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Startex" },
      { name: "description", content: "Termos de Uso da plataforma de membros Startex." },
      { property: "og:title", content: "Termos de Uso — Startex" },
      { property: "og:description", content: "Regras de uso da plataforma de membros Startex." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Termos de Uso" updated="16/11/2026">
      <h2>1. O serviço</h2>
      <p>
        A Startex é uma plataforma de educação para empreendedores, com aulas gravadas, lives de
        tira-dúvidas, Hot Seats, aulas especiais e uma loja de materiais digitais. O conteúdo tem
        caráter educativo e não constitui promessa ou garantia de resultado financeiro.
      </p>
      <h2>2. Conta</h2>
      <p>
        Para usar a plataforma você cria uma conta com dados verdadeiros e é responsável por manter
        sua senha em sigilo. O acesso é pessoal e intransferível.
      </p>
      <h2>3. Assinatura e pagamento</h2>
      <p>
        A assinatura custa {formatBRL(SUBSCRIPTION_PRICE_CENTS)} por mês, com cobrança recorrente
        mensal. Você pode cancelar a qualquer momento; o acesso continua até o fim do período pago.
      </p>
      <h2>4. Direito de arrependimento</h2>
      <p>
        Conforme o art. 49 do Código de Defesa do Consumidor, você pode desistir da contratação em
        até 7 dias e receber o valor pago de volta integralmente.
      </p>
      <h2>5. Loja</h2>
      <p>
        Produtos da loja são de uso pessoal. É proibido revender, redistribuir ou publicar os
        arquivos e ferramentas adquiridos.
      </p>
      <h2>6. Propriedade intelectual</h2>
      <p>Aulas, materiais e marcas pertencem à Startex ou a seus licenciantes. Não é permitido gravar ou compartilhar o conteúdo.</p>
      <h2>7. Contato</h2>
      <p>
        Dúvidas: <a href="mailto:contato@startex.com.br">contato@startex.com.br</a>.
      </p>
    </LegalPage>
  ),
});
