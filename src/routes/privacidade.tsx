import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Startex" },
      { name: "description", content: "Como a Startex trata os seus dados pessoais, conforme a LGPD." },
      { property: "og:title", content: "Política de Privacidade — Startex" },
      { property: "og:description", content: "Como a Startex trata os seus dados pessoais." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Política de Privacidade" updated="16/11/2026">
      <p>
        Esta política explica como a Startex trata os seus dados pessoais, de acordo com a Lei Geral
        de Proteção de Dados (Lei nº 13.709/2018).
      </p>
      <h2>Dados que coletamos</h2>
      <ul>
        <li>Cadastro: nome, e-mail, telefone e senha (guardada de forma criptografada).</li>
        <li>Registro da data em que você aceitou os Termos de Uso e esta Política.</li>
        <li>Uso da plataforma: aulas iniciadas e concluídas.</li>
      </ul>
      <h2>Para que usamos</h2>
      <ul>
        <li>Criar e manter sua conta e liberar o acesso ao conteúdo.</li>
        <li>Mostrar seu progresso nas trilhas.</li>
        <li>Entrar em contato sobre sua conta e assinatura.</li>
      </ul>
      <h2>Armazenamento no seu navegador</h2>
      <p>
        Quando você entra na sua conta, guardamos no seu navegador as informações de sessão
        necessárias para manter você conectado. Elas são apagadas quando você clica em “Sair”.
      </p>
      <h2>Estatísticas de visitas</h2>
      <p>
        Usamos as estatísticas de visitas da Lovable, a plataforma em que o site é hospedado. Elas
        não usam cookies, não guardam nada no seu dispositivo, não mantêm endereços IP e não
        identificam quem visita. Lovable coleta esses dados para nós. A{" "}
        <a href="https://lovable.dev/privacy" target="_blank" rel="noreferrer">
          política de privacidade da Lovable
        </a>{" "}
        explica como ela os trata.
      </p>
      <p>
        São registrados: as páginas visitadas, de onde o visitante veio, país, navegador, sistema
        operacional e tipo de dispositivo, tempo de permanência, velocidade de carregamento das
        páginas, erros e cliques em botões e links. Os dados detalhados ficam guardados por 90 dias e
        os resumos diários por um ano. Tudo isso é registrado para todos os visitantes, sem cookies e
        sem identificar ninguém.
      </p>
      <h2>Serviços de terceiros</h2>
      <ul>
        <li>Fontes do Google Fonts: ao carregar a página, seu navegador baixa as fontes dos servidores do Google, que recebem seu endereço IP.</li>
        <li>Vídeos do YouTube: quando uma aula usa vídeo do YouTube, o player é carregado do YouTube (modo de privacidade aprimorada), que pode registrar dados da reprodução.</li>
      </ul>
      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção ou exclusão dos seus dados pelo e-mail{" "}
        <a href="mailto:contato@startex.com.br">contato@startex.com.br</a>. Seu nome e telefone
        também podem ser alterados em “Minha conta”.
      </p>
      <p>As regras de privacidade variam entre países; confirme com um profissional se este texto atende ao seu caso.</p>
    </LegalPage>
  ),
});
