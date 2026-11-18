import { useQuery } from "@tanstack/react-query";
import {
  communityMessagesKey,
  communityThreadsKey,
  fetchCommunityMessages,
  fetchCommunityThreads,
} from "@/lib/community";

export { communityMessagesKey, communityThreadsKey };

export function useCommunityThreads(currentUserId: string | undefined) {
  return useQuery({
    queryKey: communityThreadsKey,
    queryFn: () => {
      if (!currentUserId) throw new Error("Sessão expirada.");
      return fetchCommunityThreads(currentUserId);
    },
    enabled: Boolean(currentUserId),
    staleTime: 30_000,
  });
}

export function useCommunityMessages(threadId: string | null, currentUserId: string | undefined) {
  return useQuery({
    queryKey: communityMessagesKey(threadId),
    queryFn: () => {
      if (!threadId || !currentUserId) throw new Error("Sessão expirada.");
      return fetchCommunityMessages(threadId, currentUserId);
    },
    enabled: Boolean(threadId && currentUserId),
    staleTime: 15_000,
  });
}
