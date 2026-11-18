import { describe, expect, it } from "vitest";
import {
  MAX_SPONSORED_CARDS,
  cardLocation,
  cardSchema,
  contactDigits,
  sortServiceCards,
  type ServiceCard,
} from "@/lib/marketplace";

function card(overrides: Partial<ServiceCard> = {}): ServiceCard {
  return {
    id: "id",
    user_id: "user",
    nome: "Ana Souza",
    cidade: "São Paulo",
    estado: "SP",
    servico: "Consultoria",
    descricao: "Ajudo pequenos negócios a venderem mais.",
    contato: "(11) 99999-0000",
    avatar_url: null,
    patrocinado: false,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("marketplace", () => {
  it("coloca cards patrocinados primeiro e ordena por data", () => {
    const older = card({ id: "older", created_at: "2026-01-01T00:00:00Z" });
    const newer = card({ id: "newer", created_at: "2026-02-01T00:00:00Z" });
    const sponsored = card({
      id: "sponsored",
      patrocinado: true,
      created_at: "2025-12-01T00:00:00Z",
    });

    expect(sortServiceCards([older, sponsored, newer]).map((item) => item.id)).toEqual([
      "sponsored",
      "newer",
      "older",
    ]);
  });

  it("mantém o limite de 20 cards patrocinados", () => {
    expect(MAX_SPONSORED_CARDS).toBe(20);
  });

  it("formata localização e contato", () => {
    expect(cardLocation(card())).toBe("São Paulo — SP");
    expect(cardLocation(card({ cidade: "", estado: "MG" }))).toBe("MG");
    expect(contactDigits("(11) 99999-0000")).toBe("11999990000");
  });

  it("valida os dados obrigatórios do card", () => {
    const valid = cardSchema.safeParse({
      nome: "Ana Souza",
      cidade: "São Paulo",
      estado: "SP",
      servico: "Consultoria",
      descricao: "Ajudo pequenos negócios a venderem mais.",
      contato: "(11) 99999-0000",
    });
    expect(valid.success).toBe(true);

    const invalid = cardSchema.safeParse({
      nome: "Ana",
      cidade: "São Paulo",
      estado: "SP",
      servico: "Consultoria",
      descricao: "Curto",
      contato: "123",
    });
    expect(invalid.success).toBe(false);
  });
});
