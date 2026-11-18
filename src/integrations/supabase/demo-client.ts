/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Cliente Supabase simulado para o modo demonstração LOCAL.
 *
 * Ativado somente por `npm run dev:demo` (Vite mode "demo") através do plugin
 * definido em `vite.config.ts`. O client real (`./client.ts`) não é alterado e
 * continua sendo usado em desenvolvimento normal e em produção.
 *
 * Todos os dados abaixo são fictícios e vivem só na memória do navegador.
 */

type Row = Record<string, any>;
type Filter = [column: string, value: any, op: "eq" | "in"];
type Order = { column: string; ascending: boolean };
type Mutation = {
  type: "insert" | "update" | "upsert" | "delete";
  row?: Row | undefined;
  opts?: Row | undefined;
};

const nowIso = () => new Date().toISOString();

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function dateFromNow(days: number, hour = 19, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const DEMO_USER_ID = "11111111-1111-4111-8111-111111111111";
const DEMO_STUDENT_ID = "22222222-2222-4222-8222-222222222222";
const DEMO_MEMBER_3 = "33333333-3333-4333-8333-333333333333";
const DEMO_MEMBER_4 = "44444444-4444-4444-8444-444444444444";
const DEMO_MEMBER_5 = "55555555-5555-4555-8555-555555555555";

const T1 = "a0000000-0000-4000-8000-000000000001";
const T2 = "a0000000-0000-4000-8000-000000000002";
const T3 = "a0000000-0000-4000-8000-000000000003";

const L1 = "b0000000-0000-4000-8000-000000000001";
const L2 = "b0000000-0000-4000-8000-000000000002";
const L3 = "b0000000-0000-4000-8000-000000000003";
const L4 = "b0000000-0000-4000-8000-000000000004";
const L5 = "b0000000-0000-4000-8000-000000000005";
const L6 = "b0000000-0000-4000-8000-000000000006";
const L7 = "b0000000-0000-4000-8000-000000000007";
const L8 = "b0000000-0000-4000-8000-000000000008";
const L9 = "b0000000-0000-4000-8000-000000000009";

const P1 = "c0000000-0000-4000-8000-000000000001";
const P2 = "c0000000-0000-4000-8000-000000000002";
const P3 = "c0000000-0000-4000-8000-000000000003";
const P4 = "c0000000-0000-4000-8000-000000000004";
const P5 = "c0000000-0000-4000-8000-000000000005";

const S1 = "d0000000-0000-4000-8000-000000000001";
const S2 = "d0000000-0000-4000-8000-000000000002";
const S3 = "d0000000-0000-4000-8000-000000000003";
const S4 = "d0000000-0000-4000-8000-000000000004";
const S5 = "d0000000-0000-4000-8000-000000000005";

const O1 = "e0000000-0000-4000-8000-000000000001";
const O2 = "e0000000-0000-4000-8000-000000000002";
const O3 = "e0000000-0000-4000-8000-000000000003";
const O4 = "e0000000-0000-4000-8000-000000000004";

const CT1 = "f2000000-0000-4000-8000-000000000001";
const CT2 = "f2000000-0000-4000-8000-000000000002";
const CT3 = "f2000000-0000-4000-8000-000000000003";
const CT4 = "f2000000-0000-4000-8000-000000000004";
const CPT = "a2000000-0000-4000-8000-000000000101";

const CM1 = "c2000000-0000-4000-8000-000000000001";
const CM2 = "c2000000-0000-4000-8000-000000000002";
const CM3 = "c2000000-0000-4000-8000-000000000003";
const CM4 = "c2000000-0000-4000-8000-000000000004";
const CM5 = "c2000000-0000-4000-8000-000000000005";
const CM6 = "c2000000-0000-4000-8000-000000000006";
const CM7 = "c2000000-0000-4000-8000-000000000007";
const CM8 = "c2000000-0000-4000-8000-000000000008";
const CM9 = "c2000000-0000-4000-8000-000000000009";
const CM10 = "c2000000-0000-4000-8000-000000000010";

const IMAGES = [
  "/images/exemplo/trilha-fundamentos.jpg",
  "/images/exemplo/trilha-financas.jpg",
  "/images/exemplo/trilha-vendas.jpg",
];

const VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const YOUTUBE_URL = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

const PROFILE_DEMO: Row = {
  id: DEMO_USER_ID,
  nome: "Ana Demo",
  email: "demo@startex.com.br",
  telefone: "(11) 99999-0000",
  avatar_url: "",
  cidade: "São Paulo",
  estado: "SP",
  aceite_termos_em: dateFromNow(-45, 10, 0),
  created_at: dateFromNow(-45, 10, 0),
  updated_at: nowIso(),
};

const PROFILE_STUDENT: Row = {
  id: DEMO_STUDENT_ID,
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  telefone: "(21) 98888-1111",
  avatar_url: "",
  cidade: "Rio de Janeiro",
  estado: "RJ",
  aceite_termos_em: dateFromNow(-20, 9, 0),
  created_at: dateFromNow(-20, 9, 0),
  updated_at: nowIso(),
};

const PROFILE_MEMBER_3: Row = {
  id: DEMO_MEMBER_3,
  nome: "Camila Rocha",
  email: "camila@exemplo.com",
  telefone: "(19) 98888-1234",
  avatar_url: "",
  cidade: "Campinas",
  estado: "SP",
  aceite_termos_em: dateFromNow(-30, 9, 0),
  created_at: dateFromNow(-30, 9, 0),
  updated_at: nowIso(),
};

const PROFILE_MEMBER_4: Row = {
  id: DEMO_MEMBER_4,
  nome: "Juliana Prado",
  email: "juliana@exemplo.com",
  telefone: "(31) 97777-4321",
  avatar_url: "",
  cidade: "Belo Horizonte",
  estado: "MG",
  aceite_termos_em: dateFromNow(-25, 9, 0),
  created_at: dateFromNow(-25, 9, 0),
  updated_at: nowIso(),
};

const PROFILE_MEMBER_5: Row = {
  id: DEMO_MEMBER_5,
  nome: "Rafaela Nunes",
  email: "rafaela@exemplo.com",
  telefone: "(41) 96666-5678",
  avatar_url: "",
  cidade: "Curitiba",
  estado: "PR",
  aceite_termos_em: dateFromNow(-18, 9, 0),
  created_at: dateFromNow(-18, 9, 0),
  updated_at: nowIso(),
};

const db: Record<string, Row[]> = {
  profiles: [PROFILE_DEMO, PROFILE_STUDENT, PROFILE_MEMBER_3, PROFILE_MEMBER_4, PROFILE_MEMBER_5],
  user_roles: [
    {
      id: "f0000000-0000-4000-8000-000000000001",
      user_id: DEMO_USER_ID,
      role: "admin",
      created_at: dateFromNow(-45, 10, 0),
    },
    {
      id: "f0000000-0000-4000-8000-000000000002",
      user_id: DEMO_STUDENT_ID,
      role: "member",
      created_at: dateFromNow(-20, 9, 0),
    },
    {
      id: "f0000000-0000-4000-8000-000000000003",
      user_id: DEMO_MEMBER_3,
      role: "member",
      created_at: dateFromNow(-30, 9, 0),
    },
    {
      id: "f0000000-0000-4000-8000-000000000004",
      user_id: DEMO_MEMBER_4,
      role: "member",
      created_at: dateFromNow(-25, 9, 0),
    },
    {
      id: "f0000000-0000-4000-8000-000000000005",
      user_id: DEMO_MEMBER_5,
      role: "member",
      created_at: dateFromNow(-18, 9, 0),
    },
  ],
  subscriptions: [
    {
      id: "f1000000-0000-4000-8000-000000000001",
      user_id: DEMO_USER_ID,
      status: "active",
      acesso_manual: true,
      provider: "manual",
      provider_customer_id: null,
      provider_subscription_id: null,
      current_period_end: dateFromNow(30, 23, 59),
      created_at: dateFromNow(-45, 10, 0),
      updated_at: nowIso(),
    },
    {
      id: "f1000000-0000-4000-8000-000000000002",
      user_id: DEMO_STUDENT_ID,
      status: "active",
      acesso_manual: false,
      provider: "stripe",
      provider_customer_id: "cus_demo_maria",
      provider_subscription_id: "sub_demo_maria",
      current_period_end: dateFromNow(12, 23, 59),
      created_at: dateFromNow(-20, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: "f1000000-0000-4000-8000-000000000003",
      user_id: DEMO_MEMBER_3,
      status: "active",
      acesso_manual: false,
      provider: "stripe",
      provider_customer_id: "cus_demo_camila",
      provider_subscription_id: "sub_demo_camila",
      current_period_end: dateFromNow(21, 23, 59),
      created_at: dateFromNow(-30, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: "f1000000-0000-4000-8000-000000000004",
      user_id: DEMO_MEMBER_4,
      status: "active",
      acesso_manual: false,
      provider: "stripe",
      provider_customer_id: "cus_demo_juliana",
      provider_subscription_id: "sub_demo_juliana",
      current_period_end: dateFromNow(9, 23, 59),
      created_at: dateFromNow(-25, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: "f1000000-0000-4000-8000-000000000005",
      user_id: DEMO_MEMBER_5,
      status: "active",
      acesso_manual: true,
      provider: "manual",
      provider_customer_id: null,
      provider_subscription_id: null,
      current_period_end: null,
      created_at: dateFromNow(-18, 9, 0),
      updated_at: nowIso(),
    },
  ],
  service_cards: [
    {
      id: "b3000000-0000-4000-8000-000000000001",
      user_id: DEMO_MEMBER_3,
      nome: "Camila Rocha",
      cidade: "Campinas",
      estado: "SP",
      servico: "Design e identidade visual",
      descricao:
        "Crio marcas, logotipos e materiais gráficos para pequenos negócios que querem se profissionalizar e vender mais.",
      contato: "(19) 98888-1234",
      avatar_url: "",
      patrocinado: true,
      created_at: dateFromNow(-6, 10, 0),
    },
    {
      id: "b3000000-0000-4000-8000-000000000002",
      user_id: DEMO_MEMBER_4,
      nome: "Juliana Prado",
      cidade: "Belo Horizonte",
      estado: "MG",
      servico: "Contabilidade para MEI",
      descricao:
        "Organizo a documentação e o fluxo de caixa do seu negócio para você emitir notas, pagar impostos com tranquilidade.",
      contato: "(31) 97777-4321",
      avatar_url: "",
      patrocinado: false,
      created_at: dateFromNow(-4, 10, 0),
    },
    {
      id: "b3000000-0000-4000-8000-000000000003",
      user_id: DEMO_MEMBER_5,
      nome: "Rafaela Nunes",
      cidade: "Curitiba",
      estado: "PR",
      servico: "Doces artesanais",
      descricao:
        "Produzo bolos e doces personalizados para festas e eventos, com entrega em Curitiba e região metropolitana.",
      contato: "(41) 96666-5678",
      avatar_url: "",
      patrocinado: false,
      created_at: dateFromNow(-3, 10, 0),
    },
    {
      id: "b3000000-0000-4000-8000-000000000004",
      user_id: DEMO_STUDENT_ID,
      nome: "Maria Souza",
      cidade: "Rio de Janeiro",
      estado: "RJ",
      servico: "Fotografia de produtos",
      descricao:
        "Fotos profissionais para catálogo, redes sociais e marketplaces, com estilo limpo e foco em conversão.",
      contato: "(21) 98888-1111",
      avatar_url: "",
      patrocinado: false,
      created_at: dateFromNow(-2, 10, 0),
    },
  ],
  tracks: [
    {
      id: T1,
      title: "Fundamentos do negócio",
      description: "Organize as bases do seu negócio: cliente ideal, rotina e primeiros passos.",
      cover_url: IMAGES[0],
      position: 1,
      published: true,
      is_sample: true,
      created_at: dateFromNow(-40, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: T2,
      title: "Finanças para MEI",
      description: "Separe as contas, entenda o fluxo de caixa e precifique com segurança.",
      cover_url: IMAGES[1],
      position: 2,
      published: true,
      is_sample: false,
      created_at: dateFromNow(-35, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: T3,
      title: "Vendas e marketing",
      description: "Construa uma proposta de valor clara, atenda bem e venda nas redes sociais.",
      cover_url: IMAGES[2],
      position: 3,
      published: true,
      is_sample: false,
      created_at: dateFromNow(-30, 9, 0),
      updated_at: nowIso(),
    },
  ],
  lessons: [
    {
      id: L1,
      track_id: T1,
      title: "Boas-vindas ao Startex",
      description: "Uma visão geral da plataforma e do caminho que você vai percorrer.",
      position: 1,
      published: true,
      is_free_preview: true,
      is_sample: true,
      duration_seconds: 420,
      thumbnail_url: IMAGES[0],
      created_at: dateFromNow(-40, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: L2,
      track_id: T1,
      title: "Definindo seu cliente ideal",
      description: "Como descobrir quem é o público que realmente compra de você.",
      position: 2,
      published: true,
      is_free_preview: false,
      is_sample: false,
      duration_seconds: 1260,
      thumbnail_url: IMAGES[0],
      created_at: dateFromNow(-39, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: L3,
      track_id: T1,
      title: "Organizando a rotina do negócio",
      description: "Ferramentas simples para dar previsibilidade ao seu dia a dia.",
      position: 3,
      published: true,
      is_free_preview: false,
      is_sample: false,
      duration_seconds: 980,
      thumbnail_url: IMAGES[0],
      created_at: dateFromNow(-38, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: L4,
      track_id: T2,
      title: "Separando contas pessoais e do negócio",
      description: "O primeiro passo para uma gestão financeira saudável.",
      position: 1,
      published: true,
      is_free_preview: true,
      is_sample: true,
      duration_seconds: 720,
      thumbnail_url: IMAGES[1],
      created_at: dateFromNow(-35, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: L5,
      track_id: T2,
      title: "Fluxo de caixa na prática",
      description: "Monte um fluxo de caixa simples e saiba exatamente quanto pode gastar.",
      position: 2,
      published: true,
      is_free_preview: false,
      is_sample: false,
      duration_seconds: 1500,
      thumbnail_url: IMAGES[1],
      created_at: dateFromNow(-34, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: L6,
      track_id: T2,
      title: "Precificação sem medo",
      description: "Descubra o preço certo para o seu produto ou serviço.",
      position: 3,
      published: true,
      is_free_preview: false,
      is_sample: false,
      duration_seconds: 1320,
      thumbnail_url: IMAGES[1],
      created_at: dateFromNow(-33, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: L7,
      track_id: T3,
      title: "Proposta de valor que vende",
      description: "Explique em poucas palavras por que o cliente deve escolher você.",
      position: 1,
      published: true,
      is_free_preview: false,
      is_sample: false,
      duration_seconds: 840,
      thumbnail_url: IMAGES[2],
      created_at: dateFromNow(-30, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: L8,
      track_id: T3,
      title: "Atendimento que fideliza",
      description: "Transforme um atendimento bom em clientes que voltam e indicam.",
      position: 2,
      published: true,
      is_free_preview: false,
      is_sample: false,
      duration_seconds: 1080,
      thumbnail_url: IMAGES[2],
      created_at: dateFromNow(-29, 9, 0),
      updated_at: nowIso(),
    },
    {
      id: L9,
      track_id: T3,
      title: "Redes sociais para pequenos negócios",
      description: "Um plano de conteúdo possível para quem toca o negócio sozinho.",
      position: 3,
      published: true,
      is_free_preview: false,
      is_sample: false,
      duration_seconds: 1620,
      thumbnail_url: IMAGES[2],
      created_at: dateFromNow(-28, 9, 0),
      updated_at: nowIso(),
    },
  ],
  lesson_media: [
    {
      lesson_id: L1,
      source_type: "youtube",
      youtube_url: YOUTUBE_URL,
      video_path: null,
      materials: [],
      updated_at: nowIso(),
    },
    {
      lesson_id: L2,
      source_type: "youtube",
      youtube_url: YOUTUBE_URL,
      video_path: null,
      materials: ["materiais/checklist-cliente-ideal.pdf"],
      updated_at: nowIso(),
    },
    {
      lesson_id: L3,
      source_type: "youtube",
      youtube_url: YOUTUBE_URL,
      video_path: null,
      materials: [],
      updated_at: nowIso(),
    },
    {
      lesson_id: L4,
      source_type: "upload",
      youtube_url: null,
      video_path: "demo/boas-vindas.mp4",
      materials: [],
      updated_at: nowIso(),
    },
    {
      lesson_id: L5,
      source_type: "youtube",
      youtube_url: YOUTUBE_URL,
      video_path: null,
      materials: ["materiais/planilha-fluxo-de-caixa.xlsx"],
      updated_at: nowIso(),
    },
    {
      lesson_id: L6,
      source_type: "youtube",
      youtube_url: YOUTUBE_URL,
      video_path: null,
      materials: [],
      updated_at: nowIso(),
    },
    {
      lesson_id: L7,
      source_type: "youtube",
      youtube_url: YOUTUBE_URL,
      video_path: null,
      materials: [],
      updated_at: nowIso(),
    },
    {
      lesson_id: L8,
      source_type: "youtube",
      youtube_url: YOUTUBE_URL,
      video_path: null,
      materials: [],
      updated_at: nowIso(),
    },
    {
      lesson_id: L9,
      source_type: "youtube",
      youtube_url: YOUTUBE_URL,
      video_path: null,
      materials: [],
      updated_at: nowIso(),
    },
  ],
  lesson_progress: [
    {
      user_id: DEMO_USER_ID,
      lesson_id: L1,
      completed: true,
      progress_percent: 100,
      updated_at: dateFromNow(-5, 20, 0),
    },
    {
      user_id: DEMO_USER_ID,
      lesson_id: L2,
      completed: false,
      progress_percent: 40,
      updated_at: dateFromNow(-1, 21, 0),
    },
    {
      user_id: DEMO_STUDENT_ID,
      lesson_id: L1,
      completed: true,
      progress_percent: 100,
      updated_at: dateFromNow(-10, 18, 0),
    },
  ],
  sessions: [
    {
      id: S1,
      title: "Hot Seat: precificação na prática",
      type: "hot_seat",
      starts_at: dateFromNow(2, 19, 0),
      description: "Traga seu produto e vamos ajustar o preço juntos, ao vivo.",
      join_url: "https://meet.google.com/startex-demo",
      replay_url: null,
      created_at: dateFromNow(-10, 9, 0),
    },
    {
      id: S2,
      title: "Live tira-dúvidas: finanças do MEI",
      type: "tira_duvidas",
      starts_at: dateFromNow(5, 20, 0),
      description: "Dúvidas sobre fluxo de caixa, impostos e separação de contas.",
      join_url: YOUTUBE_URL,
      replay_url: null,
      created_at: dateFromNow(-10, 9, 0),
    },
    {
      id: S3,
      title: "Aula especial: vendas no Instagram",
      type: "aula_especial",
      starts_at: dateFromNow(9, 19, 30),
      description: "Um passo a passo de conteúdo e oferta para vender sem parecer vendedor.",
      join_url: YOUTUBE_URL,
      replay_url: null,
      created_at: dateFromNow(-10, 9, 0),
    },
    {
      id: S4,
      title: "Live tira-dúvidas: organização",
      type: "tira_duvidas",
      starts_at: dateFromNow(-7, 19, 0),
      description: "Replay da live sobre rotina e ferramentas de organização.",
      join_url: null,
      replay_url: YOUTUBE_URL,
      created_at: dateFromNow(-20, 9, 0),
    },
    {
      id: S5,
      title: "Hot Seat: atendimento ao cliente",
      type: "hot_seat",
      starts_at: dateFromNow(-14, 19, 0),
      description: "Casos reais de atendimento comentados pela equipe.",
      join_url: null,
      replay_url: null,
      created_at: dateFromNow(-30, 9, 0),
    },
  ],
  products: [
    {
      id: P1,
      slug: "guia-mei-organizado",
      name: "Guia do MEI organizado",
      description:
        "Um guia prático em PDF para organizar a rotina, as contas e as obrigações do seu MEI.",
      price_cents: 4900,
      member_price_cents: 3900,
      type: "ebook_pdf",
      file_path: "ebook/guia-mei-organizado.pdf",
      cover_url: IMAGES[0],
      active: true,
      created_at: dateFromNow(-25, 9, 0),
    },
    {
      id: P2,
      slug: "planilha-fluxo-de-caixa",
      name: "Planilha de fluxo de caixa",
      description:
        "Planilha pronta em Excel para lançar entradas, saídas e acompanhar o saldo do mês.",
      price_cents: 3900,
      member_price_cents: 2900,
      type: "planilha_excel",
      file_path: "planilha/fluxo-de-caixa.xlsx",
      cover_url: IMAGES[1],
      active: true,
      created_at: dateFromNow(-20, 9, 0),
    },
    {
      id: P3,
      slug: "pitch-deck-pequenos-negocios",
      name: "Pitch deck para pequenos negócios",
      description:
        "Modelo de apresentação em PowerPoint para vender sua ideia para clientes e parceiros.",
      price_cents: 5900,
      member_price_cents: 4900,
      type: "apresentacao_ppt",
      file_path: "ppt/pitch-deck.pptx",
      cover_url: IMAGES[2],
      active: true,
      created_at: dateFromNow(-15, 9, 0),
    },
    {
      id: P4,
      slug: "calculadora-de-precificacao",
      name: "Calculadora de precificação",
      description: "Ferramenta online interativa para calcular custo, margem e preço de venda.",
      price_cents: 7900,
      member_price_cents: 5900,
      type: "ferramenta_html",
      file_path: "ferramenta/calculadora.html",
      cover_url: IMAGES[0],
      active: true,
      created_at: dateFromNow(-10, 9, 0),
    },
    {
      id: P5,
      slug: "kit-modelos-prontos",
      name: "Kit de modelos prontos",
      description:
        "Pacote de modelos de propostas e orçamentos (produto inativo, visível só no admin).",
      price_cents: 6900,
      member_price_cents: 4900,
      type: "apresentacao_ppt",
      file_path: "ppt/kit-modelos.pptx",
      cover_url: IMAGES[2],
      active: false,
      created_at: dateFromNow(-5, 9, 0),
    },
  ],
  orders: [
    {
      id: O1,
      user_id: DEMO_USER_ID,
      product_id: P1,
      status: "paid",
      provider: "manual",
      provider_session_id: "demo_session_1",
      provider_payment_intent_id: "demo_pi_1",
      amount_cents: 3900,
      created_at: dateFromNow(-3, 14, 0),
      updated_at: dateFromNow(-3, 14, 0),
    },
    {
      id: O4,
      user_id: DEMO_USER_ID,
      product_id: P4,
      status: "paid",
      provider: "demo",
      provider_session_id: "demo_session_4",
      provider_payment_intent_id: "demo_pi_4",
      amount_cents: 5900,
      created_at: dateFromNow(-1, 11, 0),
      updated_at: dateFromNow(-1, 11, 0),
    },
    {
      id: O2,
      user_id: DEMO_STUDENT_ID,
      product_id: P2,
      status: "paid",
      provider: "stripe",
      provider_session_id: "cs_demo_maria",
      provider_payment_intent_id: "pi_demo_maria",
      amount_cents: 2900,
      created_at: dateFromNow(-6, 16, 0),
      updated_at: dateFromNow(-6, 16, 0),
    },
    {
      id: O3,
      user_id: DEMO_STUDENT_ID,
      product_id: P3,
      status: "pending",
      provider: "manual",
      provider_session_id: null,
      provider_payment_intent_id: null,
      amount_cents: 4900,
      created_at: dateFromNow(-1, 10, 0),
      updated_at: dateFromNow(-1, 10, 0),
    },
  ],
  community_threads: [
    {
      id: CT1,
      title: "Mural de boas-vindas",
      description: "Apresente-se para a comunidade e conheça outros empreendedore(as).",
      is_private: false,
      created_by: null,
      created_at: dateFromNow(-4, 8, 0),
      updated_at: minutesAgo(160),
    },
    {
      id: CT2,
      title: "Dúvidas e desafios do negócio",
      description: "Compartilhe seus desafios e ajude outros membros com soluções práticas.",
      is_private: false,
      created_by: null,
      created_at: dateFromNow(-3, 8, 0),
      updated_at: minutesAgo(320),
    },
    {
      id: CT3,
      title: "Parcerias e indicações",
      description: "Encontre parceire(as), fornecedore(as) e clientes para o seu negócio.",
      is_private: false,
      created_by: null,
      created_at: dateFromNow(-2, 8, 0),
      updated_at: minutesAgo(1500),
    },
    {
      id: CT4,
      title: "Conquistas e novidades",
      description: "Celebre suas vitórias e acompanhe as novidades da Startex.",
      is_private: false,
      created_by: null,
      created_at: dateFromNow(-1, 8, 0),
      updated_at: minutesAgo(2600),
    },
    {
      id: CPT,
      title: "Conversa privada",
      description: "",
      is_private: true,
      created_by: DEMO_USER_ID,
      created_at: minutesAgo(90),
      updated_at: minutesAgo(12),
    },
  ],
  community_thread_members: [
    { thread_id: CPT, user_id: DEMO_USER_ID, created_at: minutesAgo(90) },
    { thread_id: CPT, user_id: DEMO_STUDENT_ID, created_at: minutesAgo(90) },
  ],
  community_messages: [
    {
      id: CM1,
      thread_id: CT1,
      user_id: DEMO_USER_ID,
      parent_id: null,
      content:
        "Oi, gente! Sou a Ana, acabei de entrar na comunidade. Estou montando uma marca de cosméticos naturais e quero trocar ideias com vocês.",
      mentioned_user_ids: [],
      created_at: minutesAgo(200),
    },
    {
      id: CM2,
      thread_id: CT1,
      user_id: DEMO_STUDENT_ID,
      parent_id: CM1,
      content:
        "Bem-vinda, Ana! Que bom ter você aqui. Se quiser ajuda com posicionamento e preços, me chama. @Ana",
      mentioned_user_ids: [DEMO_USER_ID],
      created_at: minutesAgo(160),
    },
    {
      id: CM3,
      thread_id: CT2,
      user_id: DEMO_STUDENT_ID,
      parent_id: null,
      content: "Como vocês definem o preço de um serviço novo sem perder clientes?",
      mentioned_user_ids: [],
      created_at: minutesAgo(390),
    },
    {
      id: CM4,
      thread_id: CT2,
      user_id: DEMO_USER_ID,
      parent_id: CM3,
      content:
        "Eu começo somando custo, tempo e impostos, depois comparo com três concorrentes. @Maria, posso te mostrar a planilha que uso.",
      mentioned_user_ids: [DEMO_STUDENT_ID],
      created_at: minutesAgo(320),
    },
    {
      id: CM5,
      thread_id: CT3,
      user_id: DEMO_USER_ID,
      parent_id: null,
      content:
        "Estou buscando parceire(as) para uma ação conjunta de conteúdo em novembro. Alguém topa?",
      mentioned_user_ids: [],
      created_at: minutesAgo(1600),
    },
    {
      id: CM6,
      thread_id: CT3,
      user_id: DEMO_STUDENT_ID,
      parent_id: CM5,
      content: "Eu topo! Trabalho com fotografia de produtos e posso contribuir com as imagens.",
      mentioned_user_ids: [],
      created_at: minutesAgo(1500),
    },
    {
      id: CM7,
      thread_id: CT4,
      user_id: DEMO_STUDENT_ID,
      parent_id: null,
      content:
        "Fechei minhas primeiras 10 vendas no novo site esta semana. Obrigada pelas dicas, comunidade!",
      mentioned_user_ids: [],
      created_at: minutesAgo(2700),
    },
    {
      id: CM8,
      thread_id: CT4,
      user_id: DEMO_USER_ID,
      parent_id: CM7,
      content: "Que notícia boa, Maria! Conta depois o que funcionou melhor no lançamento.",
      mentioned_user_ids: [],
      created_at: minutesAgo(2600),
    },
    {
      id: CM9,
      thread_id: CPT,
      user_id: DEMO_USER_ID,
      parent_id: null,
      content:
        "Oi, Maria! Queria te perguntar como você organiza a agenda entre conteúdo e atendimento.",
      mentioned_user_ids: [],
      created_at: minutesAgo(30),
    },
    {
      id: CM10,
      thread_id: CPT,
      user_id: DEMO_STUDENT_ID,
      parent_id: CM9,
      content:
        "Oi, Ana! Eu separo dois blocos fixos na semana e deixo um dia livre para imprevistos. Funciona bem para mim. @Ana",
      mentioned_user_ids: [DEMO_USER_ID],
      created_at: minutesAgo(12),
    },
  ],
  community_message_likes: [
    { message_id: CM1, user_id: DEMO_STUDENT_ID, created_at: minutesAgo(150) },
    { message_id: CM3, user_id: DEMO_USER_ID, created_at: minutesAgo(300) },
    { message_id: CM7, user_id: DEMO_USER_ID, created_at: minutesAgo(2500) },
    { message_id: CM9, user_id: DEMO_STUDENT_ID, created_at: minutesAgo(20) },
  ],
};

const ID_TABLES = new Set([
  "profiles",
  "user_roles",
  "subscriptions",
  "tracks",
  "lessons",
  "sessions",
  "products",
  "orders",
  "service_cards",
  "community_threads",
  "community_messages",
]);

function newId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `demo-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function hasActiveAccess(userId: string): boolean {
  const isAdmin = (db["user_roles"] ?? []).some(
    (r) => r["user_id"] === userId && r["role"] === "admin",
  );
  if (isAdmin) return true;
  const sub = (db["subscriptions"] ?? []).find((s) => s["user_id"] === userId);
  return Boolean(sub && (sub["acesso_manual"] || sub["status"] === "active"));
}

function sampleImageFor(path: string): string {
  let hash = 0;
  for (let i = 0; i < path.length; i += 1) hash = (hash + path.charCodeAt(i)) % IMAGES.length;
  return IMAGES[hash] ?? IMAGES[0] ?? "/images/exemplo/trilha-fundamentos.jpg";
}

const CALCULATOR_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Calculadora de precificação - Startex</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #0e162c; color: #e8eefc; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { color: #9fb0d0; font-size: 13px; margin: 0 0 18px; }
  label { display: block; font-size: 13px; margin: 12px 0 4px; color: #c8d4ec; }
  input { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #2a3a5e; background: #121d38; color: #e8eefc; font-size: 14px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .result { margin-top: 20px; padding: 16px; border-radius: 12px; background: #162448; border: 1px solid #2f4a85; }
  .result strong { display: block; font-size: 28px; color: #7fb2ff; margin-top: 4px; }
  small { color: #9fb0d0; }
</style>
</head>
<body>
  <h1>Calculadora de precificação</h1>
  <p>Exemplo interativo do produto "Ferramenta online" no modo demonstração.</p>
  <div class="row">
    <div><label>Custo do produto (R$)</label><input id="cost" type="number" min="0" step="0.01" value="20" /></div>
    <div><label>Margem desejada (%)</label><input id="margin" type="number" min="0" step="1" value="60" /></div>
  </div>
  <div class="row">
    <div><label>Custos fixos mensais (R$)</label><input id="fixed" type="number" min="0" step="0.01" value="500" /></div>
    <div><label>Vendas por mês</label><input id="sales" type="number" min="1" step="1" value="50" /></div>
  </div>
  <div class="result">
    Preço sugerido
    <strong id="price">R$ 0,00</strong>
    <small id="detail"></small>
  </div>
  <script>
    const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    function calc() {
      const cost = Number(document.getElementById("cost").value) || 0;
      const margin = Number(document.getElementById("margin").value) || 0;
      const fixed = Number(document.getElementById("fixed").value) || 0;
      const sales = Math.max(1, Number(document.getElementById("sales").value) || 1);
      const fixedPerUnit = fixed / sales;
      const base = cost + fixedPerUnit;
      const price = margin >= 100 ? base * 10 : base / (1 - margin / 100);
      document.getElementById("price").textContent = fmt(price);
      document.getElementById("detail").textContent =
        "Custo + fixo por unidade: " + fmt(base) + " • Lucro por unidade: " + fmt(price - base);
    }
    document.querySelectorAll("input").forEach((el) => el.addEventListener("input", calc));
    calc();
  </script>
</body>
</html>`;

function signedUrlFor(bucket: string, path: string): string {
  if (bucket === "videos") return VIDEO_URL;
  const lower = path.toLowerCase();
  if (lower.endsWith(".html"))
    return `data:text/html;charset=utf-8,${encodeURIComponent(CALCULATOR_HTML)}`;
  if (lower.endsWith(".pdf"))
    return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  return `data:text/plain;charset=utf-8,${encodeURIComponent(`Arquivo de demonstração: ${path}\n\nEste conteúdo é apenas um exemplo do modo demo.`)}`;
}

function makeRow(table: string, input: Row): Row {
  const row: Row = { ...input };
  const timestamp = nowIso();
  if (!row["id"] && ID_TABLES.has(table)) row["id"] = newId();
  if (row["created_at"] === undefined) row["created_at"] = timestamp;
  if (row["updated_at"] === undefined) row["updated_at"] = timestamp;

  if (table === "lesson_media") {
    if (row["materials"] === undefined) row["materials"] = [];
    if (row["source_type"] === undefined) row["source_type"] = "youtube";
  }
  if (table === "lesson_progress") {
    if (row["completed"] === undefined) row["completed"] = false;
    if (row["progress_percent"] === undefined) row["progress_percent"] = 0;
  }
  if (table === "tracks") {
    if (row["published"] === undefined) row["published"] = false;
    if (row["is_sample"] === undefined) row["is_sample"] = false;
    if (row["position"] === undefined) row["position"] = 1;
  }
  if (table === "lessons") {
    if (row["published"] === undefined) row["published"] = false;
    if (row["is_free_preview"] === undefined) row["is_free_preview"] = false;
    if (row["is_sample"] === undefined) row["is_sample"] = false;
    if (row["duration_seconds"] === undefined) row["duration_seconds"] = 0;
    if (row["position"] === undefined) row["position"] = 1;
  }
  if (table === "sessions" && row["type"] === undefined) row["type"] = "tira_duvidas";
  if (table === "products" && row["active"] === undefined) row["active"] = true;
  if (table === "orders" && row["status"] === undefined) row["status"] = "pending";
  if (table === "subscriptions") {
    if (row["status"] === undefined) row["status"] = "inactive";
    if (row["acesso_manual"] === undefined) row["acesso_manual"] = false;
  }
  if (table === "profiles") {
    if (row["nome"] === undefined) row["nome"] = "";
    if (row["email"] === undefined) row["email"] = "";
    if (row["telefone"] === undefined) row["telefone"] = "";
    if (row["avatar_url"] === undefined) row["avatar_url"] = "";
    if (row["cidade"] === undefined) row["cidade"] = "";
    if (row["estado"] === undefined) row["estado"] = "";
    if (row["aceite_termos_em"] === undefined) row["aceite_termos_em"] = null;
  }
  if (table === "service_cards") {
    if (row["nome"] === undefined) row["nome"] = "";
    if (row["cidade"] === undefined) row["cidade"] = "";
    if (row["estado"] === undefined) row["estado"] = "";
    if (row["servico"] === undefined) row["servico"] = "";
    if (row["descricao"] === undefined) row["descricao"] = "";
    if (row["contato"] === undefined) row["contato"] = "";
    if (row["avatar_url"] === undefined) row["avatar_url"] = null;
    if (row["patrocinado"] === undefined) row["patrocinado"] = false;
  }
  if (table === "community_threads") {
    if (row["title"] === undefined) row["title"] = "";
    if (row["description"] === undefined) row["description"] = "";
    if (row["is_private"] === undefined) row["is_private"] = false;
    if (row["created_by"] === undefined) row["created_by"] = null;
  }
  if (table === "community_messages") {
    if (row["parent_id"] === undefined) row["parent_id"] = null;
    if (row["content"] === undefined) row["content"] = "";
    if (row["mentioned_user_ids"] === undefined) row["mentioned_user_ids"] = [];
  }
  return row;
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((row) =>
    filters.every(([column, value, op]) => {
      if (op === "in") return Array.isArray(value) && value.includes(row[column]);
      return row[column] === value;
    }),
  );
}

function tableRows(name: string): Row[] {
  if (name === "marketplace_cards") {
    const profiles = db["profiles"] ?? [];
    return (db["service_cards"] ?? [])
      .filter((card) => hasActiveAccess(String(card["user_id"])))
      .map((card) => {
        const profile = profiles.find((candidate) => candidate["id"] === card["user_id"]);
        return {
          ...card,
          nome: card["nome"] || profile?.["nome"] || "Membro Startex",
          cidade: card["cidade"] || profile?.["cidade"] || "",
          estado: card["estado"] || profile?.["estado"] || "",
          avatar_url: card["avatar_url"] || profile?.["avatar_url"] || null,
        };
      });
  }
  if (name === "community_profiles") {
    return (db["profiles"] ?? []).map((profile) => ({
      id: profile["id"],
      nome: profile["nome"] ?? "",
      avatar_url: profile["avatar_url"] || null,
      cidade: profile["cidade"] ?? "",
      estado: profile["estado"] ?? "",
    }));
  }
  return (db[name] ??= []);
}

function decorateRow(table: string, row: Row, select?: string | null): Row {
  if (table !== "orders" || !select) return { ...row };
  const out: Row = { ...row };
  if (select.includes("product:products")) {
    out["product"] = (db["products"] ?? []).find((p) => p["id"] === row["product_id"]) ?? null;
  }
  if (select.includes("profile:profiles")) {
    out["profile"] = (db["profiles"] ?? []).find((p) => p["id"] === row["user_id"]) ?? null;
  }
  return out;
}

type QueryState = {
  table: string;
  select?: string | null | undefined;
  filters: Filter[];
  order?: Order | undefined;
  limit?: number | undefined;
  single?: "one" | "maybe" | undefined;
  mutation?: Mutation | undefined;
};

async function execute(state: QueryState): Promise<{ data: any; error: any }> {
  const table = tableRows(state.table);
  let resultRows: Row[] | null = null;

  if (state.mutation) {
    const mutation = state.mutation;
    if (mutation.type === "insert") {
      const row = makeRow(state.table, mutation.row ?? {});
      table.push(row);
      if (state.table === "community_messages") {
        const thread = (db["community_threads"] ?? []).find(
          (candidate) => candidate["id"] === row["thread_id"],
        );
        if (thread) thread["updated_at"] = nowIso();
      }
      resultRows = [row];
    } else if (mutation.type === "update") {
      const matched = applyFilters(table, state.filters);
      for (const row of matched) {
        Object.assign(row, mutation.row ?? {});
        if ("updated_at" in row) row["updated_at"] = nowIso();
      }
      resultRows = matched;
    } else if (mutation.type === "upsert") {
      const conflictColumns = mutation.opts?.["onConflict"]
        ? String(mutation.opts["onConflict"])
            .split(",")
            .map((s) => s.trim())
        : ["id"];
      const input = mutation.row ?? {};
      const existing = table.find((row) =>
        conflictColumns.every((column) => row[column] === input[column]),
      );
      if (existing) {
        if (!mutation.opts?.["ignoreDuplicates"]) {
          Object.assign(existing, input);
          if ("updated_at" in existing) existing["updated_at"] = nowIso();
        }
        resultRows = [existing];
      } else {
        const row = makeRow(state.table, input);
        table.push(row);
        resultRows = [row];
      }
    } else {
      const toDelete = new Set(applyFilters(table, state.filters));
      db[state.table] = table.filter((row) => !toDelete.has(row));
      resultRows = null;
    }
  } else {
    resultRows = applyFilters(table, state.filters);
  }

  if (resultRows) {
    resultRows = resultRows.map((row) => decorateRow(state.table, row, state.select));
    if (!state.mutation && state.order) {
      const { column, ascending } = state.order;
      resultRows = [...resultRows].sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
      });
    }
    if (!state.mutation && state.limit !== undefined) resultRows = resultRows.slice(0, state.limit);
  }

  if (!state.select && state.mutation) return { data: null, error: null };

  if (state.single) {
    const data = resultRows?.[0] ?? null;
    if (state.single === "one" && !data)
      return { data: null, error: new Error("Nenhum registro encontrado (demo).") };
    return { data, error: null };
  }

  return { data: resultRows ?? [], error: null };
}

function createQuery(table: string) {
  const state: QueryState = { table, filters: [] };

  const api: any = {
    select(columns?: string) {
      state.select = columns ?? "*";
      return api;
    },
    eq(column: string, value: any) {
      state.filters.push([column, value, "eq"]);
      return api;
    },
    in(column: string, values: any[]) {
      state.filters.push([column, values, "in"]);
      return api;
    },
    order(column: string, options?: { ascending?: boolean }) {
      state.order = { column, ascending: options?.ascending !== false };
      return api;
    },
    limit(count: number) {
      state.limit = count;
      return api;
    },
    maybeSingle() {
      state.single = "maybe";
      return api;
    },
    single() {
      state.single = "one";
      return api;
    },
    insert(row: Row | Row[]) {
      state.mutation = { type: "insert", row: Array.isArray(row) ? row[0] : row };
      return api;
    },
    update(row: Row) {
      state.mutation = { type: "update", row };
      return api;
    },
    upsert(row: Row | Row[], options?: Row) {
      state.mutation = { type: "upsert", row: Array.isArray(row) ? row[0] : row, opts: options };
      return api;
    },
    delete() {
      state.mutation = { type: "delete" };
      return api;
    },
    then(resolve: any, reject: any) {
      return execute(state).then(resolve, reject);
    },
    catch(reject: any) {
      return execute(state).catch(reject);
    },
    finally(callback: any) {
      return execute(state).finally(callback);
    },
  };

  return api;
}

type DemoListener = (event: string, session: any) => void;
const listeners = new Set<DemoListener>();
let signedIn = true;

const demoUser = {
  id: DEMO_USER_ID,
  email: PROFILE_DEMO["email"],
  phone: PROFILE_DEMO["telefone"],
  created_at: PROFILE_DEMO["created_at"],
  updated_at: nowIso(),
  app_metadata: { provider: "demo", providers: ["demo"] },
  user_metadata: { nome: PROFILE_DEMO["nome"], telefone: PROFILE_DEMO["telefone"] },
  aud: "authenticated",
  role: "authenticated",
  email_confirmed_at: PROFILE_DEMO["created_at"],
  identities: [],
  factors: [],
};

const demoSession = {
  access_token: "demo-access-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "demo-refresh-token",
  user: demoUser,
};

function currentSession() {
  return signedIn ? demoSession : null;
}

function emit(event: string) {
  for (const listener of listeners) listener(event, currentSession());
}

const auth = {
  async getUser() {
    return { data: { user: signedIn ? demoUser : null }, error: null };
  },
  async getSession() {
    return { data: { session: currentSession() }, error: null };
  },
  async getClaims() {
    return {
      data: {
        claims: {
          sub: demoUser.id,
          email: demoUser.email,
          role: "authenticated",
          aud: "authenticated",
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      error: null,
    };
  },
  async signInWithPassword() {
    signedIn = true;
    emit("SIGNED_IN");
    return { data: { user: demoUser, session: demoSession }, error: null };
  },
  async signUp() {
    signedIn = true;
    emit("SIGNED_IN");
    return { data: { user: demoUser, session: demoSession }, error: null };
  },
  async signOut() {
    signedIn = false;
    emit("SIGNED_OUT");
    return { error: null };
  },
  onAuthStateChange(callback: DemoListener) {
    listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  },
  async resetPasswordForEmail() {
    return { data: {}, error: null };
  },
  async updateUser() {
    return { data: { user: demoUser }, error: null };
  },
};

const storage = {
  from(bucket: string) {
    return {
      getPublicUrl(path: string) {
        return { data: { publicUrl: sampleImageFor(path) } };
      },
      async createSignedUrl(path: string) {
        return { data: { signedUrl: signedUrlFor(bucket, path) }, error: null };
      },
      async upload(path: string) {
        return { data: { path, id: path, fullPath: `${bucket}/${path}` }, error: null };
      },
      async remove() {
        return { data: [], error: null };
      },
      async list() {
        return { data: [], error: null };
      },
    };
  },
};

const functions = {
  async invoke(name: string, options?: { body?: any }) {
    const body = options?.body ?? {};

    if (name === "create-checkout") {
      if (body["kind"] === "product" && body["productId"]) {
        const product = (db["products"] ?? []).find((p) => p["id"] === body["productId"]);
        if (product) {
          const alreadyPaid = (db["orders"] ?? []).some(
            (o) =>
              o["user_id"] === DEMO_USER_ID &&
              o["product_id"] === product["id"] &&
              o["status"] === "paid",
          );
          if (!alreadyPaid) {
            const order = makeRow("orders", {
              user_id: DEMO_USER_ID,
              product_id: product["id"],
              status: "paid",
              provider: "demo",
              provider_session_id: `demo_session_${Date.now()}`,
              provider_payment_intent_id: `demo_pi_${Date.now()}`,
              amount_cents: product["member_price_cents"] ?? product["price_cents"],
            });
            (db["orders"] ??= []).unshift(order);
          }
        }
        return { data: { url: body["successUrl"] ?? "/meus-produtos?comprado=1" }, error: null };
      }

      if (body["kind"] === "subscription") {
        const sub = (db["subscriptions"] ?? []).find((s) => s["user_id"] === DEMO_USER_ID);
        if (sub) {
          sub["status"] = "active";
          sub["current_period_end"] = dateFromNow(30, 23, 59);
          sub["updated_at"] = nowIso();
        }
        return { data: { url: body["successUrl"] ?? "/minha-conta" }, error: null };
      }

      return { data: { url: body["successUrl"] ?? "/" }, error: null };
    }

    if (name === "customer-portal") {
      return { data: { url: body["returnUrl"] ?? "/minha-conta" }, error: null };
    }

    return { data: null, error: new Error(`Função não disponível no modo demo: ${name}`) };
  },
};

export const supabase = {
  auth,
  storage,
  functions,
  from(table: string) {
    return createQuery(table);
  },
  rpc(name: string, args?: Record<string, any>) {
    if (name === "has_active_access") {
      const userId = args?.["_user_id"] ?? DEMO_USER_ID;
      return Promise.resolve({ data: hasActiveAccess(userId), error: null });
    }
    if (name === "has_role") {
      const userId = args?.["_user_id"] ?? DEMO_USER_ID;
      const role = args?.["_role"];
      const hasRole = (db["user_roles"] ?? []).some(
        (r) => r["user_id"] === userId && r["role"] === role,
      );
      return Promise.resolve({ data: hasRole, error: null });
    }
    if (name === "get_or_create_private_thread") {
      const otherUserId = String(args?.["_other_user"] ?? "");
      if (!otherUserId || otherUserId === DEMO_USER_ID) {
        return Promise.resolve({
          data: null,
          error: new Error("Escolha outro membro para a conversa."),
        });
      }
      if (!(db["profiles"] ?? []).some((profile) => profile["id"] === otherUserId)) {
        return Promise.resolve({ data: null, error: new Error("Membro não encontrado.") });
      }

      const threads = (db["community_threads"] ??= []);
      const members = (db["community_thread_members"] ??= []);
      const existing = threads.find((thread) => {
        if (!thread["is_private"]) return false;
        const threadMembers = members.filter((member) => member["thread_id"] === thread["id"]);
        return (
          threadMembers.length === 2 &&
          threadMembers.some((member) => member["user_id"] === DEMO_USER_ID) &&
          threadMembers.some((member) => member["user_id"] === otherUserId)
        );
      });
      if (existing) return Promise.resolve({ data: existing["id"], error: null });

      const thread = makeRow("community_threads", {
        title: "Conversa privada",
        description: "",
        is_private: true,
        created_by: DEMO_USER_ID,
      });
      threads.push(thread);
      members.push({
        thread_id: thread["id"],
        user_id: DEMO_USER_ID,
        created_at: nowIso(),
      });
      members.push({
        thread_id: thread["id"],
        user_id: otherUserId,
        created_at: nowIso(),
      });
      return Promise.resolve({ data: thread["id"], error: null });
    }
    return Promise.resolve({
      data: null,
      error: new Error(`RPC não disponível no modo demo: ${name}`),
    });
  },
  channel() {
    return {
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
      unsubscribe() {
        return Promise.resolve();
      },
    };
  },
  removeChannel() {
    return Promise.resolve();
  },
};

if (typeof window !== "undefined") {
  console.info(
    "[Startex demo] Cliente Supabase simulado ativo. Dados fictícios — nenhuma chamada ao backend real.",
  );
}
