export type MercadoPagoPreferenceInput = {
  productId: string;
  title: string;
  description: string | null;
  priceCents: number;
  externalReference: string;
  notificationUrl: string;
  statementDescriptor: string;
  successUrl: string;
  cancelUrl: string;
};

export type MercadoPagoPlanInput = {
  reason: string;
  priceCents: number;
  backUrl: string;
};

export type MercadoPagoSubscriptionCheckoutInput = {
  planId: string;
  reason: string;
  payerEmail: string;
  payerName?: string | null;
  externalReference: string;
  backUrl: string;
  notificationUrl: string;
};

export function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
}

export function isActiveSubscriptionStatus(status: string | undefined): boolean {
  const value = String(status ?? "").toLowerCase();
  return value === "approved" || value === "authorized" || value === "active";
}

export function isInactiveSubscriptionStatus(status: string | undefined): boolean {
  const value = String(status ?? "").toLowerCase();
  return ["canceled", "cancelled", "expired", "paused", "rejected"].includes(value);
}

export function subscriptionPeriodEnd(nextRetryDate: string | undefined, now = Date.now()): string {
  const parsed = typeof nextRetryDate === "string" ? Date.parse(nextRetryDate) : NaN;
  return Number.isFinite(parsed)
    ? new Date(parsed).toISOString()
    : new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
}

export function buildProductPreference(input: MercadoPagoPreferenceInput): Record<string, unknown> {
  return {
    items: [
      {
        id: input.productId,
        title: input.title,
        description: input.description ?? undefined,
        quantity: 1,
        currency_id: "BRL",
        unit_price: centsToAmount(input.priceCents),
      },
    ],
    external_reference: input.externalReference,
    notification_url: input.notificationUrl || undefined,
    statement_descriptor: input.statementDescriptor || undefined,
    back_urls: {
      success: input.successUrl,
      pending: input.successUrl,
      failure: input.cancelUrl,
    },
    auto_return: "approved",
  };
}

export function buildSubscriptionPlanPayload(input: MercadoPagoPlanInput): Record<string, unknown> {
  return {
    reason: input.reason,
    back_url: input.backUrl,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: centsToAmount(input.priceCents),
      currency_id: "BRL",
    },
  };
}

export function buildSubscriptionCheckoutPayload(
  input: MercadoPagoSubscriptionCheckoutInput,
): Record<string, unknown> {
  return {
    plan_id: input.planId,
    reason: input.reason,
    payer: {
      email: input.payerEmail,
      ...(input.payerName ? { name: input.payerName } : {}),
    },
    external_reference: input.externalReference,
    back_url: input.backUrl,
    notification_url: input.notificationUrl || undefined,
  };
}

export const PUBLISHED_APP_URL = "https://startexedu.lovable.app";
export const SUBSCRIPTION_REASON = "Assinatura Startex";

export type MercadoPagoPendingSubscriptionInput = {
  reason: string;
  priceCents: number;
  payerEmail: string;
  externalReference: string;
  backUrl: string;
};

/**
 * Assinatura recorrente sem plano associado: o Mercado Pago devolve um
 * `init_point` onde o aluno informa o cartão. (Assinaturas ligadas a um plano
 * exigem token de cartão gerado no próprio site.)
 */
export function buildPendingSubscriptionPayload(
  input: MercadoPagoPendingSubscriptionInput,
): Record<string, unknown> {
  return {
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    back_url: input.backUrl,
    status: "pending",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: centsToAmount(input.priceCents),
      currency_id: "BRL",
    },
  };
}

/** O Mercado Pago só aceita URLs de retorno https; fora disso usa o site publicado. */
export function checkoutOrigin(requestOrigin: string | null | undefined): string {
  const value = String(requestOrigin ?? "").replace(/\/+$/, "");
  return value.startsWith("https://") ? value : PUBLISHED_APP_URL;
}

/** Mantém a URL de retorno no mesmo domínio do checkout. */
export function sameOriginUrl(value: string | undefined, fallbackPath: string, origin: string): string {
  if (!value) return `${origin}${fallbackPath}`;
  try {
    const parsed = new URL(value, origin);
    return parsed.origin === origin ? parsed.toString() : `${origin}${fallbackPath}`;
  } catch {
    return `${origin}${fallbackPath}`;
  }
}

/** Monta o texto assinado pelo Mercado Pago no cabeçalho x-signature. */
export function webhookSignatureManifest(input: {
  dataId: string;
  requestId: string;
  ts: string;
}): string {
  const id = /^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId;
  let manifest = "";
  if (id) manifest += `id:${id};`;
  if (input.requestId) manifest += `request-id:${input.requestId};`;
  manifest += `ts:${input.ts};`;
  return manifest;
}

export function parseSignatureHeader(header: string): { ts: string; v1: string } | null {
  const ts = header.match(/ts=(\d+)/)?.[1];
  const v1 = header.match(/v1=([a-f0-9]+)/i)?.[1];
  return ts && v1 ? { ts, v1: v1.toLowerCase() } : null;
}
