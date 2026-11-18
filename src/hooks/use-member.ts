import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_OWNER_EMAIL } from "@/lib/owner";

export type Member = {
  userId: string;
  email: string;
  nome: string;
  telefone: string;
  avatarUrl: string;
  cidade: string;
  estado: string;
  aceiteTermosEm: string | null;
  criadoEm: string;
  isAdmin: boolean;
  hasAccess: boolean;
  subscription: {
    status: string;
    current_period_end: string | null;
    acesso_manual: boolean;
  } | null;
};

export const memberQueryKey = ["member"] as const;

type ProfileRow = {
  nome: string | null;
  email: string | null;
  telefone: string | null;
  aceite_termos_em: string | null;
  created_at: string;
  avatar_url: string | null;
  cidade: string | null;
  estado: string | null;
};

async function fetchMember(): Promise<Member | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [profileRes, rolesRes, accessRes, subRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.rpc("has_active_access", { _user_id: user.id }),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, acesso_manual")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;

  const profile = profileRes.data as ProfileRow | null;
  const email = (user.email || "").trim().toLowerCase();
  const isOwner = email === ADMIN_OWNER_EMAIL.toLowerCase();
  const isAdmin = isOwner || (rolesRes.data ?? []).some((r) => r.role === "admin");
  return {
    userId: user.id,
    email: user.email || profile?.email || "",
    nome: profile?.nome || (user.user_metadata?.["nome"] as string | undefined) || "",
    telefone: profile?.telefone ?? "",
    avatarUrl: profile?.avatar_url ?? "",
    cidade: profile?.cidade ?? "",
    estado: profile?.estado ?? "",
    aceiteTermosEm: profile?.aceite_termos_em ?? null,
    criadoEm: profile?.created_at ?? user.created_at,
    isAdmin,
    hasAccess: isAdmin || accessRes.data === true,
    subscription: subRes.data ?? null,
  };
}

export function useMember() {
  return useQuery({ queryKey: memberQueryKey, queryFn: fetchMember, staleTime: 60_000 });
}

/** Sessão para a área pública (cabeçalho do site). */
export function useSessionUser() {
  return useQuery({
    queryKey: ["session-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user ?? null;
    },
    staleTime: 30_000,
  });
}
