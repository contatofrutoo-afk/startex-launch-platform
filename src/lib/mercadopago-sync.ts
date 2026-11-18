import { syncMercadoPago, type MercadoPagoSyncResult } from "@/lib/mercadopago.functions";

export type MercadoPagoSyncKind = "product" | "subscription" | "all";
export type { MercadoPagoSyncResult };

export async function syncMercadoPagoPrices(
  input: { kind: MercadoPagoSyncKind; productId?: string } = { kind: "all" },
): Promise<MercadoPagoSyncResult> {
  const result = await syncMercadoPago({ data: input });
  if (!result.ok) throw new Error(result.error ?? "A sincronização não foi concluída.");
  return result;
}
