import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

export const signupSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, { message: "Informe seu nome completo." })
    .max(120, { message: "O nome deve ter no máximo 120 caracteres." }),
  email: z
    .string()
    .trim()
    .email({ message: "Informe um e-mail válido." })
    .max(255, { message: "E-mail muito longo." }),
  telefone: z
    .string()
    .refine((v) => {
      const digits = v.replace(/\D/g, "");
      return digits.length === 10 || digits.length === 11;
    }, { message: "Informe um telefone com DDD." }),
  senha: z
    .string()
    .min(PASSWORD_MIN_LENGTH, { message: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` })
    .max(72, { message: "A senha deve ter no máximo 72 caracteres." }),
  aceite: z.literal(true, {
    errorMap: () => ({ message: "Você precisa aceitar os Termos e a Política de Privacidade." }),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Informe um e-mail válido." }),
  senha: z.string().min(1, { message: "Informe sua senha." }),
});

export const newPasswordSchema = z
  .object({
    senha: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { message: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` })
      .max(72),
    confirmar: z.string(),
  })
  .refine((v) => v.senha === v.confirmar, { message: "As senhas não conferem.", path: ["confirmar"] });

/** Aceita só caminhos internos (evita redirecionamento para outro site). */
export function safeRedirect(value: unknown, fallback = "/trilhas"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
