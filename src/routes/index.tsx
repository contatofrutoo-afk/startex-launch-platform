import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  Check,
  Clapperboard,
  ShoppingBag,
  Sparkles,
  UserPlus,
  CreditCard,
  PlayCircle,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SubscribeButton } from "@/components/app/SubscribeButton";
import { SUBSCRIPTION_PRICE_CENTS, formatBRL } from "@/lib/format";
import { useSubscriptionPriceCents } from "@/hooks/use-subscription-price";
import { useResumeSubscriptionCheckout } from "@/hooks/use-subscription-checkout";
import hero from "@/assets/hero-empreendedora.jpg";

const PRICE = formatBRL(SUBSCRIPTION_PRICE_CENTS, { compact: true });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `Startex — Área de membros para empreendedores | ${PRICE}/mês` },
      {
        name: "description",
        content: `Aulas gravadas, lives de tira-dúvidas, Hot Seats, aulas especiais e loja de ferramentas para pequenos negócios e MEIs. Assinatura de ${PRICE} por mês.`,
      },
      { property: "og:title", content: "Startex — Network de Empreendedores" },
      {
        property: "og:description",
        content:
          "Aulas gravadas, lives, Hot Seats e ferramentas práticas para donos de pequenos negócios e MEIs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalesPage,
});

const FEATURES = [
  {
    icon: Clapperboard,
    title: "Trilhas de aulas gravadas",
    text: "Organizadas por tema, para assistir no seu ritmo, de qualquer dispositivo.",
  },
  {
    icon: CalendarClock,
    title: "Lives de tira-dúvidas e Hot Seats",
    text: "Agenda com datas e link de acesso. Traga suas dúvidas e o seu caso real.",
  },
  {
    icon: Sparkles,
    title: "Aulas especiais ao vivo",
    text: "Encontros temáticos sinalizados na agenda, com replay quando disponível.",
  },
  {
    icon: ShoppingBag,
    title: "Loja de materiais",
    text: "Ebooks, planilhas em Excel, apresentações em PowerPoint e ferramentas online.",
  },
];

const STEPS = (price: string) => [
  { icon: UserPlus, title: "Cadastre-se", text: "Crie sua conta em menos de um minuto." },
  { icon: CreditCard, title: "Assine", text: `Assinatura mensal de ${price}, sem fidelidade.` },
  {
    icon: PlayCircle,
    title: "Comece a assistir",
    text: "Acesse as trilhas, a agenda de lives e a loja.",
  },
];

const INCLUDED = [
  "Acesso a todas as trilhas de aulas gravadas",
  "Lives de tira-dúvidas e Hot Seats",
  "Aulas especiais ao vivo",
  "Preço especial para assinantes em itens da loja",
  "Novas aulas adicionadas ao longo do tempo",
];

const FAQ = [
  {
    q: "Como funcionam as lives e os Hot Seats?",
    a: "Na área de membros há uma agenda com data, horário e link de cada sessão (Google Meet ou YouTube). Nas lives você tira dúvidas; nos Hot Seats, alguns participantes apresentam o próprio caso para análise ao vivo. Quando houver gravação, o replay fica disponível na agenda.",
  },
  {
    q: "Como cancelo a assinatura?",
    a: 'Você pode cancelar quando quiser pela área "Minha conta". O acesso continua até o fim do período já pago e não há multa nem fidelidade.',
  },
  {
    q: "Quais são as formas de pagamento?",
    a: "Cartão de crédito via Mercado Pago, com cobrança recorrente mensal. Outras formas de pagamento poderão ser adicionadas no futuro.",
  },
  {
    q: "Tenho direito de arrependimento?",
    a: "Sim. Conforme o Código de Defesa do Consumidor (art. 49), você pode desistir em até 7 dias após a contratação e receber o valor pago de volta integralmente.",
  },
  {
    q: "Como acesso a loja?",
    a: 'Pelo menu da área de membros, em "Loja". Qualquer pessoa cadastrada pode comprar; assinantes podem ter preço especial. Os itens comprados ficam em "Meus produtos" para baixar ou abrir.',
  },
];

function SalesPage() {
  useResumeSubscriptionCheckout();
  const priceCents = useSubscriptionPriceCents();
  const price = formatBRL(priceCents, { compact: true });
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative isolate flex min-h-[88vh] items-end overflow-hidden pt-16 md:items-center">
        <img
          src={hero}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-fade-bottom" />
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 md:pb-0">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              Área de membros para empreendedores
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Organize e faça o seu negócio <span className="text-gradient-brand">crescer</span>, no
              seu ritmo.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Aulas gravadas, lives de tira-dúvidas, Hot Seats e ferramentas práticas para donos de
              pequenos negócios e MEIs — tudo em um só lugar.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <SubscribeButton size="lg" label="Quero entrar" />
              <span className="text-sm text-muted-foreground">
                {price}/mês · cancele quando quiser
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold sm:text-4xl">O que você terá dentro da plataforma</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-1"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-brand text-foreground">
                <Icon className="size-6" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Como funciona</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS(price).map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-4">
                <span className="font-display text-5xl font-extrabold text-primary/30">
                  {i + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="size-5 text-primary" />
                    <h3 className="text-lg font-semibold">{title}</h3>
                  </div>
                  <p className="mt-1 text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* For whom */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div className="rounded-2xl border border-success/30 bg-card p-8">
          <h2 className="text-2xl font-bold">Para quem é</h2>
          <ul className="mt-6 space-y-3">
            {[
              "Donos de pequenos negócios que querem organizar a gestão",
              "MEIs que estão começando ou querem dar o próximo passo",
              "Quem prefere aprender com exemplos práticos e tirar dúvidas ao vivo",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-success" /> <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-destructive/30 bg-card p-8">
          <h2 className="text-2xl font-bold">Para quem não é</h2>
          <ul className="mt-6 space-y-3">
            {[
              "Quem procura promessa de dinheiro rápido ou garantido",
              "Quem não pretende dedicar tempo para aplicar o que aprende",
              "Grandes empresas em busca de consultoria personalizada",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <X className="mt-0.5 size-5 shrink-0 text-destructive" /> <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6" id="preco">
        <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border border-primary/40 bg-card p-8 shadow-glow sm:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-brand" />
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Assinatura Startex
          </p>
          <p className="mt-4 font-display text-5xl font-extrabold">
            {price} <span className="text-lg font-medium text-muted-foreground">por mês</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cobrança recorrente mensal. Cancele quando quiser.
          </p>
          <ul className="mt-8 space-y-3">
            {INCLUDED.map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" /> <span>{t}</span>
              </li>
            ))}
          </ul>
          <SubscribeButton size="lg" className="mt-8 w-full" label="Quero entrar" />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Direito de arrependimento de 7 dias, conforme o CDC.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQ.map(({ q, a }) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
          Pronto para aprender com quem também empreende?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Crie sua conta agora e conheça as trilhas. Algumas aulas de amostra são liberadas para
          todos os cadastrados.
        </p>
        <SubscribeButton size="lg" className="mt-8" label="Quero entrar" />
      </section>

      <SiteFooter />
    </div>
  );
}
