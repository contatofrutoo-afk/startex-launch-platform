import { supabase } from "@/integrations/supabase/client";

export type MercadoPagoSyncKind = "product" | "subscription" | "all";

export type MercadoPagoSyncResult = {
  ok: boolean;
  products: number;
  subscription: boolean;
  planId?: string | null;
};

type InvokeResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

type FunctionsClient = {
  invoke(
    name: string,
    options: { body: Record<string, unknown> },
  ): PromiseLike<InvokeResponse<MercadoPagoSyncResult>>;
};

const client = supabase as unknown as { functions: FunctionsClient };

export async function syncMercadoPagoPrices(
  input: { kind: MercadoPagoSyncKind; productId?: string } = { kind: "all" },
): Promise<MercadoPagoSyncResult> {
  const { data, error } = await client.functions.invoke("mercadopago-sync-price", {
    body: { ...input },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error("A sincronização não foi concluída.");
  return data;
}
