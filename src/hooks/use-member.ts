import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Member = {
  userId: string;
  email: string;
  nome: string;
  telefone: string;
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

  const profile = profileRes.data;
  return {
    userId: user.id,
    email: profile?.email || user.email || "",
    nome: profile?.nome || (user.user_metadata?.["nome"] as string | undefined) || "",
    telefone: profile?.telefone ?? "",
    aceiteTermosEm: profile?.aceite_termos_em ?? null,
    criadoEm: profile?.created_at ?? user.created_at,
    isAdmin: (rolesRes.data ?? []).some((r) => r.role === "admin"),
    hasAccess: accessRes.data === true,
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
