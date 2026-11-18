import { useQuery } from "@tanstack/react-query";
import {
  adminServiceCardsKey,
  fetchAdminServiceCards,
  fetchServiceCards,
  marketplaceCardsKey,
} from "@/lib/marketplace";

export function useServiceCards() {
  return useQuery({
    queryKey: marketplaceCardsKey,
    queryFn: fetchServiceCards,
    staleTime: 30_000,
  });
}

export function useAdminServiceCards(enabled: boolean) {
  return useQuery({
    queryKey: adminServiceCardsKey,
    queryFn: fetchAdminServiceCards,
    enabled,
    staleTime: 30_000,
  });
}
