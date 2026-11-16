import { describe, expect, it } from "vitest";
import { SUBSCRIPTION_PRICE_CENTS, formatBRL, maskPhoneBR, firstName } from "@/lib/format";
import { signupSchema, safeRedirect } from "@/lib/validation";
import { canWatchLesson, youtubeId } from "@/lib/lessons";

const valid = {
  nome: "Maria Silva",
  email: "maria@exemplo.com",
  telefone: "(11) 91234-5678",
  senha: "12345678",
  aceite: true as const,
};

describe("Assinatura", () => {
  it("custa R$ 297 por mês", () => {
    expect(SUBSCRIPTION_PRICE_CENTS).toBe(29700);
    expect(formatBRL(SUBSCRIPTION_PRICE_CENTS, { compact: true })).toBe("R$ 297");
  });
});

describe("Cadastro", () => {
  it("aceita nome, e-mail, telefone, senha de 8 caracteres e aceite", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });
  it("recusa senha com menos de 8 caracteres", () => {
    expect(signupSchema.safeParse({ ...valid, senha: "1234567" }).success).toBe(false);
  });
  it("exige o aceite dos Termos e da Política", () => {
    expect(signupSchema.safeParse({ ...valid, aceite: false }).success).toBe(false);
  });
  it("exige telefone com DDD", () => {
    expect(signupSchema.safeParse({ ...valid, telefone: "91234-5678" }).success).toBe(false);
  });
});

describe("Máscara de telefone", () => {
  it("formata celular e fixo", () => {
    expect(maskPhoneBR("11912345678")).toBe("(11) 91234-5678");
    expect(maskPhoneBR("1132345678")).toBe("(11) 3234-5678");
  });
});

describe("Acesso às aulas", () => {
  it("sem assinatura, só amostra gratuita é liberada", () => {
    expect(canWatchLesson({ is_free_preview: false }, false)).toBe(false);
    expect(canWatchLesson({ is_free_preview: true }, false)).toBe(true);
  });
  it("assinante ativo assiste a qualquer aula", () => {
    expect(canWatchLesson({ is_free_preview: false }, true)).toBe(true);
  });
});

describe("Utilitários", () => {
  it("extrai o ID de links do YouTube, inclusive não listados", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=abc123XYZ_0")).toBe("abc123XYZ_0");
    expect(youtubeId("https://youtu.be/abc123XYZ_0?si=x")).toBe("abc123XYZ_0");
    expect(youtubeId("https://example.com/video")).toBeNull();
  });
  it("só redireciona para caminhos internos", () => {
    expect(safeRedirect("/aula/1")).toBe("/aula/1");
    expect(safeRedirect("https://malicioso.com")).toBe("/trilhas");
    expect(safeRedirect("//malicioso.com")).toBe("/trilhas");
  });
  it("usa o primeiro nome na saudação", () => {
    expect(firstName("Maria Silva")).toBe("Maria");
  });
});
