import { describe, expect, it } from "vitest";
import {
  defaultPaymentSettings,
  isMercadoPagoConfigured,
  mercadoPagoWebhookUrl,
  paymentSettingsFromRow,
  paymentSettingsToRow,
} from "@/lib/payment-settings";

describe("payment settings", () => {
  it("monta a URL do webhook sem barras duplicadas", () => {
    expect(mercadoPagoWebhookUrl("https://startexedu.lovable.app/")).toBe(
      "https://startexedu.lovable.app/api/public/mercadopago-webhook",
    );
  });

  it("converte a linha do banco para o formulário", () => {
    const settings = paymentSettingsFromRow({
      enabled: true,
      sandbox: true,
      public_key: "APP_USR-key",
      access_token: "APP_USR-token",
      webhook_secret: "secret",
      user_id: "123",
      site_id: "MLB",
      subscription_price_cents: 34900,
      updated_at: "2026-01-01T00:00:00Z",
    });

    expect(settings.enabled).toBe(true);
    expect(settings.sandbox).toBe(false);
    expect(settings.userId).toBe("123");
    expect(settings.siteId).toBe("MLB");
    expect(settings.subscriptionPriceCents).toBe(34900);
    expect(settings.updatedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("usa modo real por padrão quando a linha não existe", () => {
    expect(paymentSettingsFromRow(null).sandbox).toBe(false);
    expect(paymentSettingsFromRow(null).siteId).toBe("MLB");
  });

  it("normaliza os dados antes de salvar", () => {
    const settings = defaultPaymentSettings("https://app.supabase.co");
    const row = paymentSettingsToRow({
      ...settings,
      sandbox: true,
      publicKey: "  TEST-key  ",
      siteId: " mlb ",
      statementDescriptor: " Startex ",
    });

    expect(row["sandbox"]).toBe(false);
    expect(row["public_key"]).toBe("TEST-key");
    expect(row["site_id"]).toBe("MLB");
    expect(row["statement_descriptor"]).toBe("Startex");
    expect(row["subscription_price_cents"]).toBe(29700);
    expect(row["provider"]).toBe("mercadopago");
  });

  it("só considera a integração configurada com todas as credenciais", () => {
    const base = defaultPaymentSettings("https://app.supabase.co");
    expect(isMercadoPagoConfigured(base)).toBe(false);

    const ready = {
      ...base,
      enabled: true,
      publicKey: "TEST-key",
      accessToken: "TEST-token",
      webhookSecret: "secret",
      userId: "123",
    };
    expect(isMercadoPagoConfigured(ready)).toBe(true);
  });
});
