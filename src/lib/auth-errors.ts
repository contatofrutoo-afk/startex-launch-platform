export function authErrorMessage(error: { message?: string | undefined; code?: string | undefined } | null | undefined): string {
  const msg = (error?.message ?? "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("already registered") || msg.includes("already been registered") || error?.code === "user_already_exists")
    return "Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.";
  if (msg.includes("pwned") || msg.includes("weak") || error?.code === "weak_password")
    return "Essa senha é muito comum ou já apareceu em vazamentos. Escolha outra.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (msg.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  return "Não foi possível concluir agora. Tente novamente em instantes.";
}
