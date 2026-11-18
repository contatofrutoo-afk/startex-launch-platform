import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  buildPendingSubscriptionPayload,
  buildProductPreference,
  buildSubscriptionTestPreference,
  buildSubscriptionPlanPayload,
  isActiveSubscriptionStatus,
  isInactiveSubscriptionStatus,
  subscriptionPeriodEnd,
  SUBSCRIPTION_REASON,
} from "@/lib/mercadopago-pricing";
import { SUBSCRIPTION_PRICE_CENTS } from "@/lib/format";

type Admin = SupabaseClient<Database>;

export type MercadoPagoSettings = {
  enabled: boolean;
  sandbox: boolean;
  accessToken: string;
  webhookSecret: string;
  notificationUrl: string;
  statementDescriptor: string;
  subscriptionPlanId: string;
  subscriptionPriceCents: number;
};

export class MercadoPagoError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "MercadoPagoError";
    this.status = status;
  }
}

const MP_API = "https://api.mercadopago.com";

export async function loadMercadoPagoSettings(admin: Admin): Promise<MercadoPagoSettings | null> {
  const { data, error } = await admin
    .from("payment_settings")
    .select("*")
    .eq("provider", "mercadopago")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  const text = (key: string) => (typeof row[key] === "string" ? (row[key] as string).trim() : "");
  return {
    enabled: row["enabled"] === true,
    sandbox: row["sandbox"] !== false,
    accessToken: text("access_token"),
    webhookSecret: text("webhook_secret"),
    notificationUrl: text("notification_url"),
    statementDescriptor: text("statement_descriptor"),
    subscriptionPlanId: text("subscription_plan_id"),
    subscriptionPriceCents:
      typeof row["subscription_price_cents"] === "number"
        ? (row["subscription_price_cents"] as number)
        : SUBSCRIPTION_PRICE_CENTS,
  };
}

export function requireUsableSettings(settings: MercadoPagoSettings | null): MercadoPagoSettings {
  if (!settings) throw new MercadoPagoError("Configuração do Mercado Pago não encontrada.");
  if (!settings.enabled) throw new MercadoPagoError("Integração Mercado Pago desativada no admin.");
  if (!settings.accessToken) throw new MercadoPagoError("Access Token do Mercado Pago não configurado.");
  return settings;
}

export async function mpRequest<T>(
  accessToken: string,
  path: string,
  method: "GET" | "POST" | "PUT" = "GET",
  payload?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${MP_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const raw = await response.text();
  let body: (T & { message?: string }) | null = null;
  try {
    body = raw ? (JSON.parse(raw) as T & { message?: string }) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    console.error("[mercadopago]", method, path, response.status, raw.slice(0, 500));
    throw new MercadoPagoError(
      body?.message ? `Mercado Pago: ${body.message}` : `Mercado Pago retornou ${response.status}.`,
      response.status >= 500 ? 502 : 400,
    );
  }
  return body as T;
}

type CheckoutResponse = { id?: string; init_point?: string; sandbox_init_point?: string };

function pickCheckoutUrl(body: CheckoutResponse, sandbox: boolean): string {
  const url = sandbox
    ? (body.sandbox_init_point ?? body.init_point)
    : (body.init_point ?? body.sandbox_init_point);
  if (!url) throw new MercadoPagoError("Mercado Pago não retornou a página de pagamento.", 502);
  return url;
}

export async function createSubscriptionCheckout(input: {
  settings: MercadoPagoSettings;
  userId: string;
  email: string;
  backUrl: string;
  cancelUrl: string;
}): Promise<string> {
  if (input.settings.sandbox) {
    const preference = buildSubscriptionTestPreference({
      priceCents: input.settings.subscriptionPriceCents,
      externalReference: `subscription:${input.userId}`,
      notificationUrl: input.settings.notificationUrl,
      statementDescriptor: input.settings.statementDescriptor,
      successUrl: input.backUrl,
      cancelUrl: input.cancelUrl,
    });
    const res = await mpRequest<CheckoutResponse>(
      input.settings.accessToken,
      "/checkout/preferences",
      "POST",
      preference,
    );
    return pickCheckoutUrl(res, true);
  }
  const payload = buildPendingSubscriptionPayload({
    reason: SUBSCRIPTION_REASON,
    priceCents: input.settings.subscriptionPriceCents,
    payerEmail: input.email,
    externalReference: `subscription:${input.userId}`,
    backUrl: input.backUrl,
  });
  const res = await mpRequest<CheckoutResponse>(input.settings.accessToken, "/preapproval", "POST", payload);
  // Assinaturas sempre usam init_point (não existe sandbox_init_point para preapproval).
  return pickCheckoutUrl(res, false);
}

export async function createProductCheckout(input: {
  admin: Admin;
  settings: MercadoPagoSettings;
  userId: string;
  productId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const { data: product, error } = await input.admin
    .from("products")
    .select("id, name, description, price_cents, member_price_cents, active")
    .eq("id", input.productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!product || !product.active) throw new MercadoPagoError("Produto não encontrado.", 404);

  const { data: hasAccess } = await input.admin.rpc("has_active_access", { _user_id: input.userId });
  const priceCents =
    hasAccess === true && typeof product.member_price_cents === "number"
      ? product.member_price_cents
      : product.price_cents;

  const payload = buildProductPreference({
    productId: product.id,
    title: product.name,
    description: product.description,
    priceCents,
    externalReference: `product:${product.id}:user:${input.userId}`,
    notificationUrl: input.settings.notificationUrl,
    statementDescriptor: input.settings.statementDescriptor,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
  });
  const res = await mpRequest<CheckoutResponse>(
    input.settings.accessToken,
    "/checkout/preferences",
    "POST",
    payload,
  );
  return pickCheckoutUrl(res, input.settings.sandbox);
}

/** Mantém um plano de referência no Mercado Pago com o preço atual da assinatura. */
export async function syncSubscriptionPlan(
  admin: Admin,
  settings: MercadoPagoSettings,
  origin: string,
): Promise<string> {
  const payload = buildSubscriptionPlanPayload({
    reason: SUBSCRIPTION_REASON,
    priceCents: Math.max(0, settings.subscriptionPriceCents),
    backUrl: `${origin}/trilhas?assinatura=ok`,
  });
  if (settings.subscriptionPlanId) {
    await mpRequest(settings.accessToken, `/preapproval_plan/${settings.subscriptionPlanId}`, "PUT", payload);
    return settings.subscriptionPlanId;
  }
  const created = await mpRequest<{ id?: string }>(settings.accessToken, "/preapproval_plan", "POST", payload);
  if (!created.id) throw new MercadoPagoError("Mercado Pago não retornou o ID do plano.", 502);
  const { error } = await admin
    .from("payment_settings")
    .update({ subscription_plan_id: created.id })
    .eq("provider", "mercadopago");
  if (error) throw new Error(error.message);
  return created.id;
}

/** Confere se o Access Token é aceito pelo Mercado Pago. */
export async function verifyCredentials(settings: MercadoPagoSettings): Promise<void> {
  await mpRequest(settings.accessToken, "/users/me");
}

// ---------- Webhook ----------

type MpPreapproval = { status?: string; external_reference?: string; next_payment_date?: string; next_retry_date?: string };
type MpPayment = {
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
};
type MpAuthorizedPayment = { preapproval_id?: string };

export async function syncPreapproval(admin: Admin, settings: MercadoPagoSettings, id: string) {
  const sub = await mpRequest<MpPreapproval>(settings.accessToken, `/preapproval/${encodeURIComponent(id)}`);
  const reference = String(sub.external_reference ?? "");
  if (!reference.startsWith("subscription:")) return;
  const userId = reference.slice("subscription:".length);
  if (!userId) return;
  const active = isActiveSubscriptionStatus(sub.status);
  if (!active && !isInactiveSubscriptionStatus(sub.status)) return;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      status: active ? "active" : "canceled",
      current_period_end: active
        ? subscriptionPeriodEnd(sub.next_payment_date ?? sub.next_retry_date)
        : new Date().toISOString(),
      provider: "mercadopago",
      provider_subscription_id: id,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

export async function syncAuthorizedPayment(admin: Admin, settings: MercadoPagoSettings, id: string) {
  const ap = await mpRequest<MpAuthorizedPayment>(
    settings.accessToken,
    `/authorized_payments/${encodeURIComponent(id)}`,
  );
  if (ap.preapproval_id) await syncPreapproval(admin, settings, String(ap.preapproval_id));
}

export async function syncPayment(admin: Admin, settings: MercadoPagoSettings, id: string) {
  const payment = await mpRequest<MpPayment>(settings.accessToken, `/v1/payments/${encodeURIComponent(id)}`);
  if (payment.status !== "approved") return;
  const reference = String(payment.external_reference ?? "");
  if (reference.startsWith("subscription:")) {
    const userId = reference.slice("subscription:".length);
    if (!userId) return;
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        status: "active",
        current_period_end: subscriptionPeriodEnd(undefined),
        provider: "mercadopago",
        provider_subscription_id: `payment:${id}`,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return;
  }
  const match = String(payment.external_reference ?? "").match(/^product:([^:]+):user:([^:]+)$/);
  if (!match?.[1] || !match[2]) return;

  const { data: existing, error: lookupError } = await admin
    .from("orders")
    .select("id")
    .eq("provider_payment_intent_id", id)
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);

  const order = {
    user_id: match[2],
    product_id: match[1],
    status: "paid",
    provider: "mercadopago",
    provider_payment_intent_id: id,
    provider_session_id: id,
    amount_cents: Math.round(Number(payment.transaction_amount ?? 0) * 100),
  };
  const { error } = existing
    ? await admin.from("orders").update(order).eq("id", existing.id)
    : await admin.from("orders").insert(order);
  if (error) throw new Error(error.message);
}
