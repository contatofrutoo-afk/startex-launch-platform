import { supabase } from "@/integrations/supabase/client";

type DbRow = Record<string, unknown>;

type DbResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

type QueryBuilder = PromiseLike<DbResponse<DbRow[]>> & {
  eq(column: string, value: unknown): QueryBuilder;
  in(column: string, values: unknown[]): QueryBuilder;
  order(column: string, options: { ascending: boolean }): QueryBuilder;
};

type CommunityDb = {
  from(table: string): {
    select(columns?: string): QueryBuilder;
    insert(row: DbRow): PromiseLike<DbResponse<DbRow[]>>;
    delete(): QueryBuilder;
  };
  rpc(name: string, args: DbRow): PromiseLike<DbResponse<unknown>>;
};

const db = supabase as unknown as CommunityDb;

export type CommunityProfile = {
  id: string;
  nome: string;
  avatar_url: string | null;
  cidade: string;
  estado: string;
};

export type CommunityThread = {
  id: string;
  title: string;
  description: string;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityMessage = {
  id: string;
  thread_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  mentioned_user_ids: string[];
  created_at: string;
};

export type CommunityLike = {
  message_id: string;
  user_id: string;
};

export type CommunityMessageView = CommunityMessage & {
  author: CommunityProfile | null;
  likes: CommunityLike[];
  likeCount: number;
  likedByMe: boolean;
  mentionedProfiles: CommunityProfile[];
  replies: CommunityMessageView[];
};

export type CommunityThreadView = CommunityThread & {
  otherProfile: CommunityProfile | null;
};

export type CommunityThreadsResult = {
  profiles: CommunityProfile[];
  threads: CommunityThread[];
  general: CommunityThread[];
  privateThreads: CommunityThreadView[];
};

export const communityThreadsKey = ["community", "threads"] as const;

export function communityMessagesKey(threadId: string | null) {
  return ["community", "messages", threadId ?? "none"] as const;
}

export function communityDisplayName(profile: CommunityProfile | null | undefined): string {
  return profile?.nome?.trim() || "Membro Startex";
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SX";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function profileLocation(profile: CommunityProfile | null | undefined): string {
  if (!profile) return "Localização não informada";
  const cidade = profile.cidade.trim();
  const estado = profile.estado.trim().toUpperCase();
  if (cidade && estado) return `${cidade} — ${estado}`;
  if (cidade) return cidade;
  if (estado) return estado;
  return "Localização não informada";
}

function toProfile(row: DbRow): CommunityProfile {
  return {
    id: String(row["id"]),
    nome: String(row["nome"] ?? "").trim() || "Membro Startex",
    avatar_url: row["avatar_url"] ? String(row["avatar_url"]) : null,
    cidade: String(row["cidade"] ?? ""),
    estado: String(row["estado"] ?? ""),
  };
}

function toMessage(row: DbRow): CommunityMessage {
  return {
    id: String(row["id"]),
    thread_id: String(row["thread_id"]),
    user_id: String(row["user_id"]),
    parent_id: row["parent_id"] ? String(row["parent_id"]) : null,
    content: String(row["content"] ?? ""),
    mentioned_user_ids: Array.isArray(row["mentioned_user_ids"])
      ? row["mentioned_user_ids"].map((id: unknown) => String(id))
      : [],
    created_at: String(row["created_at"]),
  };
}

function toThread(row: DbRow): CommunityThread {
  return {
    id: String(row["id"]),
    title: String(row["title"] ?? ""),
    description: String(row["description"] ?? ""),
    is_private: Boolean(row["is_private"]),
    created_by: row["created_by"] ? String(row["created_by"]) : null,
    created_at: String(row["created_at"]),
    updated_at: String(row["updated_at"] ?? row["created_at"]),
  };
}

export function buildCommunityMessages(
  messages: CommunityMessage[],
  likes: CommunityLike[],
  profiles: CommunityProfile[],
  currentUserId: string,
): CommunityMessageView[] {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const likesByMessage = new Map<string, CommunityLike[]>();
  for (const like of likes) {
    const list = likesByMessage.get(like.message_id) ?? [];
    list.push(like);
    likesByMessage.set(like.message_id, list);
  }

  const views = new Map<string, CommunityMessageView>();
  for (const message of messages) {
    const messageLikes = likesByMessage.get(message.id) ?? [];
    const mentionedProfiles = message.mentioned_user_ids
      .map((id) => profilesById.get(id))
      .filter((profile): profile is CommunityProfile => Boolean(profile));
    views.set(message.id, {
      ...message,
      author: profilesById.get(message.user_id) ?? null,
      likes: messageLikes,
      likeCount: messageLikes.length,
      likedByMe: messageLikes.some((like) => like.user_id === currentUserId),
      mentionedProfiles,
      replies: [],
    });
  }

  const roots: CommunityMessageView[] = [];
  for (const view of views.values()) {
    if (view.parent_id) {
      const parent = views.get(view.parent_id);
      if (parent) parent.replies.push(view);
      else roots.push(view);
    } else {
      roots.push(view);
    }
  }

  const byCreatedAt = (a: CommunityMessageView, b: CommunityMessageView) =>
    a.created_at.localeCompare(b.created_at);

  roots.sort(byCreatedAt);
  for (const root of roots) root.replies.sort(byCreatedAt);
  return roots;
}

export async function fetchCommunityThreads(
  currentUserId: string,
): Promise<CommunityThreadsResult> {
  const [profilesRes, threadsRes, membersRes] = await Promise.all([
    db
      .from("community_profiles")
      .select("id, nome, avatar_url, cidade, estado")
      .order("nome", { ascending: true }),
    db
      .from("community_threads")
      .select("id, title, description, is_private, created_by, created_at, updated_at")
      .order("created_at", { ascending: true }),
    db.from("community_thread_members").select("thread_id, user_id"),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (threadsRes.error) throw threadsRes.error;
  if (membersRes.error) throw membersRes.error;

  const profiles: CommunityProfile[] = (profilesRes.data ?? []).map(toProfile);
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const threads: CommunityThread[] = (threadsRes.data ?? []).map(toThread);

  const membersByThread = new Map<string, string[]>();
  for (const row of membersRes.data ?? []) {
    const threadId = String(row["thread_id"]);
    const userId = String(row["user_id"]);
    const list = membersByThread.get(threadId) ?? [];
    if (!list.includes(userId)) list.push(userId);
    membersByThread.set(threadId, list);
  }

  const general = threads.filter((thread) => !thread.is_private);
  const privateThreads: CommunityThreadView[] = threads
    .filter((thread) => thread.is_private)
    .map((thread) => {
      const memberIds = membersByThread.get(thread.id) ?? [];
      if (!memberIds.includes(currentUserId)) return null;
      const otherId = memberIds.find((id) => id !== currentUserId) ?? null;
      return {
        ...thread,
        otherProfile: otherId ? (profilesById.get(otherId) ?? null) : null,
      };
    })
    .filter((thread): thread is CommunityThreadView => thread !== null)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return { profiles, threads, general, privateThreads };
}

export async function fetchCommunityMessages(
  threadId: string,
  currentUserId: string,
): Promise<CommunityMessageView[]> {
  const messagesRes = await db
    .from("community_messages")
    .select("id, thread_id, user_id, parent_id, content, mentioned_user_ids, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (messagesRes.error) throw messagesRes.error;

  const messages: CommunityMessage[] = (messagesRes.data ?? []).map(toMessage);
  if (messages.length === 0) return [];

  const messageIds = messages.map((message) => message.id);
  const profileIds = Array.from(
    new Set([
      ...messages.map((message) => message.user_id),
      ...messages.flatMap((message) => message.mentioned_user_ids),
    ]),
  );

  const [likesRes, profilesRes] = await Promise.all([
    db.from("community_message_likes").select("message_id, user_id").in("message_id", messageIds),
    db
      .from("community_profiles")
      .select("id, nome, avatar_url, cidade, estado")
      .in("id", profileIds),
  ]);

  if (likesRes.error) throw likesRes.error;
  if (profilesRes.error) throw profilesRes.error;

  const likes: CommunityLike[] = (likesRes.data ?? []).map((row: DbRow) => ({
    message_id: String(row["message_id"]),
    user_id: String(row["user_id"]),
  }));
  const profiles: CommunityProfile[] = (profilesRes.data ?? []).map(toProfile);

  return buildCommunityMessages(messages, likes, profiles, currentUserId);
}

export async function insertCommunityMessage(input: {
  threadId: string;
  userId: string;
  content: string;
  parentId: string | null;
  mentionedUserIds: string[];
}): Promise<void> {
  const { error } = await db.from("community_messages").insert({
    thread_id: input.threadId,
    user_id: input.userId,
    parent_id: input.parentId,
    content: input.content,
    mentioned_user_ids: input.mentionedUserIds,
  });
  if (error) throw error;
}

export async function setCommunityLike(
  messageId: string,
  userId: string,
  liked: boolean,
): Promise<void> {
  const { error } = liked
    ? await db
        .from("community_message_likes")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", userId)
    : await db.from("community_message_likes").insert({ message_id: messageId, user_id: userId });
  if (error) throw error;
}

export async function deleteCommunityMessage(messageId: string): Promise<void> {
  const { error } = await db.from("community_messages").delete().eq("id", messageId);
  if (error) throw error;
}

export async function createPrivateThread(otherUserId: string): Promise<string> {
  const { data, error } = await db.rpc("get_or_create_private_thread", {
    _other_user: otherUserId,
  });
  if (error) throw error;
  if (!data) throw new Error("Não foi possível iniciar a conversa.");
  return String(data);
}
