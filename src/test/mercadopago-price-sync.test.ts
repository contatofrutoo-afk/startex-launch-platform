import { describe, expect, it } from "vitest";
import {
  buildProductPreference,
  buildSubscriptionCheckoutPayload,
  buildSubscriptionPlanPayload,
  centsToAmount,
  isActiveSubscriptionStatus,
  isInactiveSubscriptionStatus,
  subscriptionPeriodEnd,
} from "@/lib/mercadopago-pricing";
import { getPaymentAdapter } from "@/lib/payments";

describe("mercado pago price sync", () => {
  it("converts cents to reais", () => {
    expect(centsToAmount(29700)).toBe(297);
    expect(centsToAmount(3990)).toBe(39.9);
  });

  it("builds a product preference with the current price", () => {
    const payload = buildProductPreference({
      productId: "prod-1",
      title: "Ebook",
      description: "Material digital",
      priceCents: 4990,
      externalReference: "product:prod-1",
      notificationUrl: "https://app.supabase.co/functions/v1/mercadopago-webhook",
      statementDescriptor: "STARTEX",
      successUrl: "https://startex.com.br/meus-produtos?compra=ok",
      cancelUrl: "https://startex.com.br/loja",
    }) as {
      items: Array<{ unit_price: number; currency_id: string }>;
      external_reference: string;
      notification_url: string;
    };

    expect(payload.items[0]?.unit_price).toBe(49.9);
    expect(payload.items[0]?.currency_id).toBe("BRL");
    expect(payload.external_reference).toBe("product:prod-1");
    expect(payload.notification_url).toContain("mercadopago-webhook");
  });

  it("builds the subscription plan update with the monthly amount", () => {
    const payload = buildSubscriptionPlanPayload({
      reason: "Assinatura Startex",
      priceCents: 29700,
      backUrl: "https://startex.com.br/trilhas?assinatura=ok",
    }) as {
      auto_recurring: { transaction_amount: number; frequency: number; frequency_type: string };
    };

    expect(payload.auto_recurring.transaction_amount).toBe(297);
    expect(payload.auto_recurring.frequency).toBe(1);
    expect(payload.auto_recurring.frequency_type).toBe("months");
  });

  it("usa o Mercado Pago como provedor de pagamento", () => {
    expect(getPaymentAdapter().provider).toBe("mercadopago");
  });

  it("monta o checkout da assinatura com plano, pagador e referência do usuário", () => {
    const payload = buildSubscriptionCheckoutPayload({
      planId: "plan-123",
      reason: "Assinatura Startex",
      payerEmail: "aluno@exemplo.com",
      payerName: "Maria Silva",
      externalReference: "subscription:user-123",
      backUrl: "https://startex.com.br/trilhas?assinatura=ok",
      notificationUrl: "https://app.supabase.co/functions/v1/mercadopago-webhook",
    }) as {
      plan_id: string;
      payer: { email: string; name: string };
      external_reference: string;
      back_url: string;
      notification_url: string;
    };

    expect(payload.plan_id).toBe("plan-123");
    expect(payload.payer.email).toBe("aluno@exemplo.com");
    expect(payload.payer.name).toBe("Maria Silva");
    expect(payload.external_reference).toBe("subscription:user-123");
    expect(payload.back_url).toContain("/trilhas?assinatura=ok");
    expect(payload.notification_url).toContain("mercadopago-webhook");
  });

  it("reconhece os status que liberam e revogam a assinatura", () => {
    expect(isActiveSubscriptionStatus("authorized")).toBe(true);
    expect(isActiveSubscriptionStatus("APPROVED")).toBe(true);
    expect(isActiveSubscriptionStatus("active")).toBe(true);
    expect(isActiveSubscriptionStatus("pending")).toBe(false);
    expect(isInactiveSubscriptionStatus("pending")).toBe(false);
    expect(isInactiveSubscriptionStatus("cancelled")).toBe(true);
    expect(isInactiveSubscriptionStatus("paused")).toBe(true);
  });

  it("usa a próxima cobrança ou 30 dias como fim do período", () => {
    const now = Date.parse("2026-11-01T00:00:00Z");
    expect(subscriptionPeriodEnd("2026-12-15T00:00:00Z", now)).toBe("2026-12-15T00:00:00.000Z");
    expect(subscriptionPeriodEnd(undefined, now)).toBe("2026-12-01T00:00:00.000Z");
  });
});

import {
  buildPendingSubscriptionPayload,
  checkoutOrigin,
  webhookSignatureManifest,
  parseSignatureHeader,
} from "@/lib/mercadopago-pricing";

describe("checkout da assinatura Startex", () => {
  it("cobra R$ 297 por mês em reais, vinculado ao aluno", () => {
    const payload = buildPendingSubscriptionPayload({
      reason: "Assinatura Startex",
      priceCents: 29700,
      payerEmail: "aluno@exemplo.com",
      externalReference: "subscription:user-1",
      backUrl: "https://startexedu.lovable.app/trilhas?assinatura=ok",
    }) as {
      status: string;
      payer_email: string;
      external_reference: string;
      auto_recurring: { transaction_amount: number; frequency: number; frequency_type: string; currency_id: string };
    };
    expect(payload.auto_recurring.transaction_amount).toBe(297);
    expect(payload.auto_recurring.frequency).toBe(1);
    expect(payload.auto_recurring.frequency_type).toBe("months");
    expect(payload.auto_recurring.currency_id).toBe("BRL");
    expect(payload.status).toBe("pending");
    expect(payload.external_reference).toBe("subscription:user-1");
  });

  it("usa o site publicado como retorno quando a origem não é https", () => {
    expect(checkoutOrigin("http://localhost:8080")).toBe("https://startexedu.lovable.app");
    expect(checkoutOrigin("https://startexedu.lovable.app/")).toBe("https://startexedu.lovable.app");
  });

  it("monta o texto assinado do webhook no formato do Mercado Pago", () => {
    expect(webhookSignatureManifest({ dataId: "ABC123", requestId: "req-1", ts: "1700" })).toBe(
      "id:abc123;request-id:req-1;ts:1700;",
    );
    expect(parseSignatureHeader("ts=1700,v1=ABCDEF")).toEqual({ ts: "1700", v1: "abcdef" });
    expect(parseSignatureHeader("garbage")).toBeNull();
  });
});

import { buildSubscriptionTestPreference } from "@/lib/mercadopago-pricing";

describe("assinatura em modo teste", () => {
  it("cobra a mensalidade de R$ 297 vinculada ao aluno", () => {
    const payload = buildSubscriptionTestPreference({
      priceCents: 29700,
      externalReference: "subscription:user-1",
      notificationUrl: "https://startexedu.lovable.app/api/public/mercadopago-webhook",
      statementDescriptor: "STARTEX",
      successUrl: "https://startexedu.lovable.app/trilhas?assinatura=ok",
      cancelUrl: "https://startexedu.lovable.app/minha-conta",
    }) as { items: Array<{ unit_price: number; currency_id: string }>; external_reference: string };
    expect(payload.items[0]?.unit_price).toBe(297);
    expect(payload.items[0]?.currency_id).toBe("BRL");
    expect(payload.external_reference).toBe("subscription:user-1");
  });
});
