import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

type QueryResult = { data: unknown; error: { message: string } | null };
type SelectQuery = {
  order(column: string, options?: { ascending?: boolean }): PromiseLike<QueryResult>;
};
type Db = {
  from(table: string): {
    select(columns?: string): SelectQuery;
    upsert(
      row: Record<string, unknown>,
      options?: { onConflict?: string },
    ): PromiseLike<QueryResult>;
    update(row: Record<string, unknown>): {
      eq(column: string, value: unknown): PromiseLike<QueryResult>;
    };
  };
};

// Tabelas/views novas ainda não estão nos tipos gerados do Supabase.
const db = supabase as unknown as Db;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export const MAX_SPONSORED_CARDS = 20;
export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type ServiceCard = {
  id: string;
  user_id: string;
  nome: string;
  cidade: string;
  estado: string;
  servico: string;
  descricao: string;
  contato: string;
  avatar_url: string | null;
  patrocinado: boolean;
  created_at: string;
};

export type ServiceCardInput = {
  nome: string;
  cidade: string;
  estado: string;
  servico: string;
  descricao: string;
  contato: string;
  avatar_url: string | null;
};

export const cardSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, { message: "Informe seu nome." })
    .max(120, { message: "O nome deve ter no máximo 120 caracteres." }),
  cidade: z
    .string()
    .trim()
    .min(2, { message: "Informe sua cidade." })
    .max(80, { message: "A cidade deve ter no máximo 80 caracteres." }),
  estado: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[A-Za-z]{2}$/.test(value), {
      message: "Use a sigla com 2 letras (ex.: SP).",
    }),
  servico: z
    .string()
    .trim()
    .min(2, { message: "Informe o serviço ou o nome da empresa." })
    .max(120, { message: "Use no máximo 120 caracteres." }),
  descricao: z
    .string()
    .trim()
    .min(10, { message: "Descreva melhor seu trabalho ou produto." })
    .max(600, { message: "A descrição deve ter no máximo 600 caracteres." }),
  contato: z.string().refine((value) => [10, 11].includes(value.replace(/\D/g, "").length), {
    message: "Informe um telefone com DDD.",
  }),
});

export const marketplaceCardsKey = ["marketplace", "cards"] as const;
export const adminServiceCardsKey = ["admin", "service-cards"] as const;

function toCard(value: unknown): ServiceCard {
  const row = asRecord(value);
  return {
    id: asText(row["id"]),
    user_id: asText(row["user_id"]),
    nome: asText(row["nome"]).trim() || "Membro Startex",
    cidade: asText(row["cidade"]),
    estado: asText(row["estado"]),
    servico: asText(row["servico"]),
    descricao: asText(row["descricao"]),
    contato: asText(row["contato"]),
    avatar_url: row["avatar_url"] ? asText(row["avatar_url"]) : null,
    patrocinado: Boolean(row["patrocinado"]),
    created_at: asText(row["created_at"]),
  };
}

/** Patrocinados primeiro; entre eles, os mais recentes primeiro. */
export function sortServiceCards(cards: ServiceCard[]): ServiceCard[] {
  return [...cards].sort((a, b) => {
    if (a.patrocinado !== b.patrocinado) return a.patrocinado ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

export function cardLocation(card: ServiceCard): string {
  const cidade = card.cidade.trim();
  const estado = card.estado.trim().toUpperCase();
  if (cidade && estado) return `${cidade} — ${estado}`;
  if (cidade) return cidade;
  if (estado) return estado;
  return "Localização não informada";
}

export function contactDigits(contato: string): string {
  return contato.replace(/\D/g, "");
}

export async function fetchServiceCards(): Promise<ServiceCard[]> {
  const { data, error } = await db
    .from("marketplace_cards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return sortServiceCards((Array.isArray(data) ? data : []).map(toCard));
}

export async function fetchAdminServiceCards(): Promise<ServiceCard[]> {
  const { data, error } = await db
    .from("service_cards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(toCard);
}

export async function saveServiceCard(userId: string, input: ServiceCardInput): Promise<void> {
  const { error } = await db.from("service_cards").upsert(
    {
      user_id: userId,
      nome: input.nome,
      cidade: input.cidade,
      estado: input.estado.toUpperCase(),
      servico: input.servico,
      descricao: input.descricao,
      contato: input.contato,
      avatar_url: input.avatar_url,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function setCardSponsored(cardId: string, sponsored: boolean): Promise<void> {
  const { error } = await db
    .from("service_cards")
    .update({ patrocinado: sponsored })
    .eq("id", cardId);
  if (error) throw error;
}

export async function uploadCardAvatar(userId: string, file: File): Promise<string> {
  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(rawExt) ? rawExt : "jpg";
  const path = `${userId}/marketplace/card-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (error || !data) throw error ?? new Error("Falha no envio da imagem.");

  const { data: publicData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(data.path);
  return publicData.publicUrl;
}
