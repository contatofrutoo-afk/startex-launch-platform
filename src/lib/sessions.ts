export type SessionType = "hot_seat" | "tira_duvidas" | "aula_especial";

export type LiveSession = {
  id: string;
  title: string;
  type: SessionType;
  starts_at: string;
  description: string | null;
  join_url: string | null;
  replay_url: string | null;
  created_at?: string;
};

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  hot_seat: "Hot Seat",
  tira_duvidas: "Live tira-dúvidas",
  aula_especial: "Aula especial",
};

export function sessionTypeLabel(type: string): string {
  return SESSION_TYPE_LABEL[type as SessionType] ?? type;
}
