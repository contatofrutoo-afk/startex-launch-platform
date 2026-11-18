import { describe, expect, it } from "vitest";
import {
  buildCommunityMessages,
  communityDisplayName,
  initials,
  profileLocation,
  type CommunityLike,
  type CommunityMessage,
  type CommunityProfile,
} from "@/lib/community";

const profiles: CommunityProfile[] = [
  { id: "ana", nome: "Ana Souza", avatar_url: null, cidade: "São Paulo", estado: "SP" },
  { id: "maria", nome: "Maria Lima", avatar_url: null, cidade: "", estado: "MG" },
];

function message(overrides: Partial<CommunityMessage>): CommunityMessage {
  return {
    id: "m1",
    thread_id: "thread",
    user_id: "ana",
    parent_id: null,
    content: "Mensagem",
    mentioned_user_ids: [],
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("community", () => {
  it("formata nome, iniciais e localização dos membros", () => {
    expect(communityDisplayName(profiles[0])).toBe("Ana Souza");
    expect(communityDisplayName(null)).toBe("Membro Startex");
    expect(initials("  ana souza ")).toBe("AS");
    expect(initials("")).toBe("SX");
    expect(profileLocation(profiles[0])).toBe("São Paulo — SP");
    expect(profileLocation(profiles[1])).toBe("MG");
    expect(profileLocation(null)).toBe("Localização não informada");
  });

  it("monta respostas, curtidas e menções a partir das mensagens", () => {
    const messages = [
      message({ id: "root", created_at: "2026-01-01T00:00:00Z" }),
      message({
        id: "reply",
        user_id: "maria",
        parent_id: "root",
        content: "Resposta",
        mentioned_user_ids: ["ana"],
        created_at: "2026-01-01T00:01:00Z",
      }),
    ];
    const likes: CommunityLike[] = [
      { message_id: "root", user_id: "maria" },
      { message_id: "root", user_id: "ana" },
    ];

    const [view] = buildCommunityMessages(messages, likes, profiles, "ana");

    expect(view?.id).toBe("root");
    expect(view?.likeCount).toBe(2);
    expect(view?.likedByMe).toBe(true);
    expect(view?.replies).toHaveLength(1);
    expect(view?.replies[0]?.author?.nome).toBe("Maria Lima");
    expect(view?.replies[0]?.mentionedProfiles.map((profile) => profile.id)).toEqual(["ana"]);
  });
});
