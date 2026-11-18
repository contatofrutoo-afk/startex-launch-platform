import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_PRICE_CENTS } from "@/lib/format";

export const subscriptionPriceKey = ["public-subscription-price"] as const;

type PublicPriceRow = { price_cents?: number };

type RpcClient = {
  rpc(name: string): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

const client = supabase as unknown as RpcClient;

export async function fetchSubscriptionPriceCents(): Promise<number> {
  const { data, error } = await client.rpc("get_public_subscription_price");
  if (error) throw error;
  const rows = Array.isArray(data) ? (data as PublicPriceRow[]) : [];
  const cents = rows[0]?.price_cents;
  return typeof cents === "number" && cents >= 0 ? cents : SUBSCRIPTION_PRICE_CENTS;
}

export function useSubscriptionPriceCents(): number {
  const query = useQuery({
    queryKey: subscriptionPriceKey,
    queryFn: fetchSubscriptionPriceCents,
    staleTime: 60_000,
  });
  return query.data ?? SUBSCRIPTION_PRICE_CENTS;
}
