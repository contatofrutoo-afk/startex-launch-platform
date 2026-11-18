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

export function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
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
