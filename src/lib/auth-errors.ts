export function authErrorMessage(error: { message?: string | undefined; code?: string | undefined } | null | undefined): string {
  const msg = (error?.message ?? "").toLowerCase();
  const code = (error?.code ?? "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("already registered") || msg.includes("already been registered") || code === "user_already_exists")
    return "Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.";
  if (msg.includes("pwned") || msg.includes("weak") || code === "weak_password")
    return "Essa senha é muito comum ou já apareceu em vazamentos. Escolha outra.";
  if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("over_email_send_rate_limit"))
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (msg.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("signups not allowed") || code === "signup_disabled")
    return "Novos cadastros estão temporariamente desativados.";
  if (msg.includes("database error saving new user") || msg.includes("unexpected_failure"))
    return "Não foi possível criar sua conta (erro no servidor/banco). Verifique se o banco e o gatilho de perfil estão configurados no Lovable Cloud.";
  if (msg.includes("invalid email")) return "Informe um e-mail válido.";
  return "Não foi possível concluir agora. Tente novamente em instantes.";
}
