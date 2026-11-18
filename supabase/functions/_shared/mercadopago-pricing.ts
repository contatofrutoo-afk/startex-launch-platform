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
  payerEmail?: string | null;
  payerName?: string | null;
  externalReference: string;
  backUrl: string;
  notificationUrl: string;
};

export function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
}

export function isMercadoPagoTestToken(accessToken: string | undefined): boolean {
  return String(accessToken ?? "")
    .trim()
    .toUpperCase()
    .startsWith("TEST-");
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
    ...(input.payerEmail
      ? {
          payer: {
            email: input.payerEmail,
            ...(input.payerName ? { name: input.payerName } : {}),
          },
        }
      : {}),
    external_reference: input.externalReference,
    back_url: input.backUrl,
    notification_url: input.notificationUrl || undefined,
  };
}
