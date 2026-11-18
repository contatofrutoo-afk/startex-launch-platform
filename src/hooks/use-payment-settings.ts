import { useQuery } from "@tanstack/react-query";
import { fetchPaymentSettings, paymentSettingsKey } from "@/lib/payment-settings";

export { paymentSettingsKey };

export function usePaymentSettings() {
  return useQuery({
    queryKey: paymentSettingsKey,
    queryFn: fetchPaymentSettings,
    staleTime: 30_000,
  });
}
