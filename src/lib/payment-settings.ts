import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_PRICE_CENTS } from "@/lib/format";

export const MERCADO_PAGO_PROVIDER = "mercadopago";
export const paymentSettingsKey = ["payment-settings", MERCADO_PAGO_PROVIDER] as const;

export type PaymentSettings = {
  provider: typeof MERCADO_PAGO_PROVIDER;
  enabled: boolean;
  sandbox: boolean;
  publicKey: string;
  accessToken: string;
  webhookSecret: string;
  userId: string;
  integratorId: string;
  siteId: string;
  subscriptionPlanId: string;
  subscriptionPriceCents: number;
  pixKey: string;
  statementDescriptor: string;
  notificationUrl: string;
  updatedAt: string | null;
};

export type PaymentSettingsRow = Record<string, unknown>;

type DbResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

type SelectBuilder = PromiseLike<DbResponse<PaymentSettingsRow[]>> & {
  eq(column: string, value: unknown): SelectBuilder;
  maybeSingle(): PromiseLike<DbResponse<PaymentSettingsRow | null>>;
};

type PaymentSettingsDb = {
  from(table: string): {
    select(columns: string): SelectBuilder;
    upsert(
      row: PaymentSettingsRow,
      options?: { onConflict?: string },
    ): PromiseLike<DbResponse<PaymentSettingsRow[]>>;
  };
};

const db = supabase as unknown as PaymentSettingsDb;

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function mercadoPagoWebhookUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/api/public/mercadopago-webhook`;
}

export function paymentSettingsFromRow(row: PaymentSettingsRow | null): PaymentSettings {
  return {
    provider: MERCADO_PAGO_PROVIDER,
    enabled: row?.["enabled"] === true,
    sandbox: row?.["sandbox"] !== false,
    publicKey: asText(row?.["public_key"]),
    accessToken: asText(row?.["access_token"]),
    webhookSecret: asText(row?.["webhook_secret"]),
    userId: asText(row?.["user_id"]),
    integratorId: asText(row?.["integrator_id"]),
    siteId: asText(row?.["site_id"]) || "MLB",
    subscriptionPlanId: asText(row?.["subscription_plan_id"]),
    subscriptionPriceCents:
      typeof row?.["subscription_price_cents"] === "number"
        ? row["subscription_price_cents"]
        : SUBSCRIPTION_PRICE_CENTS,
    pixKey: asText(row?.["pix_key"]),
    statementDescriptor: asText(row?.["statement_descriptor"]),
    notificationUrl: asText(row?.["notification_url"]),
    updatedAt: typeof row?.["updated_at"] === "string" ? row["updated_at"] : null,
  };
}

export function paymentSettingsToRow(settings: PaymentSettings): PaymentSettingsRow {
  return {
    provider: MERCADO_PAGO_PROVIDER,
    enabled: settings.enabled,
    sandbox: settings.sandbox,
    public_key: settings.publicKey.trim(),
    access_token: settings.accessToken.trim(),
    webhook_secret: settings.webhookSecret.trim(),
    user_id: settings.userId.trim(),
    integrator_id: settings.integratorId.trim(),
    site_id: settings.siteId.trim().toUpperCase() || "MLB",
    subscription_plan_id: settings.subscriptionPlanId.trim(),
    subscription_price_cents: Math.max(0, Math.round(settings.subscriptionPriceCents)),
    pix_key: settings.pixKey.trim(),
    statement_descriptor: settings.statementDescriptor.trim(),
    notification_url: settings.notificationUrl.trim(),
  };
}

export function defaultPaymentSettings(baseUrl = ""): PaymentSettings {
  return {
    provider: MERCADO_PAGO_PROVIDER,
    enabled: false,
    sandbox: true,
    publicKey: "",
    accessToken: "",
    webhookSecret: "",
    userId: "",
    integratorId: "",
    siteId: "MLB",
    subscriptionPlanId: "",
    subscriptionPriceCents: SUBSCRIPTION_PRICE_CENTS,
    pixKey: "",
    statementDescriptor: "STARTEX",
    notificationUrl: mercadoPagoWebhookUrl(baseUrl),
    updatedAt: null,
  };
}

export function isMercadoPagoConfigured(settings: PaymentSettings): boolean {
  return Boolean(
    settings.enabled &&
    settings.publicKey.trim() &&
    settings.accessToken.trim() &&
    settings.webhookSecret.trim() &&
    settings.userId.trim(),
  );
}

export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  const { data, error } = await db
    .from("payment_settings")
    .select("*")
    .eq("provider", MERCADO_PAGO_PROVIDER)
    .maybeSingle();
  if (error) throw error;
  return paymentSettingsFromRow(data);
}

export async function savePaymentSettings(settings: PaymentSettings): Promise<void> {
  const { error } = await db
    .from("payment_settings")
    .upsert(paymentSettingsToRow(settings), { onConflict: "provider" });
  if (error) throw error;
}
