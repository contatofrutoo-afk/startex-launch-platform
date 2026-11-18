import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildProductPreference,
  buildSubscriptionCheckoutPayload,
  isMercadoPagoTestToken,
} from "../_shared/mercadopago-pricing.ts";

type SettingsRow = {
  enabled: boolean;
  sandbox: boolean;
  access_token: string;
  notification_url: string;
  statement_descriptor: string;
  subscription_plan_id: string;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  member_price_cents: number | null;
};

type CheckoutResponse = {
  init_point?: string;
  sandbox_init_point?: string;
};

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new HttpError("Supabase não configurado na função.", 500);
  return createClient(url, key, { auth: { persistSession: false } });
}

async function requireUser(req: Request, admin: ReturnType<typeof adminClient>) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError("Autenticação necessária.", 401);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError("Autenticação inválida.", 401);
  return data.user;
}

async function loadSettings(admin: ReturnType<typeof adminClient>): Promise<SettingsRow | null> {
  const { data, error } = await admin
    .from("payment_settings")
    .select("*")
    .eq("provider", "mercadopago")
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0] as SettingsRow | undefined) ?? null;
}

async function mpRequest<T>(
  accessToken: string,
  path: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as T & { message?: string }) : null;
  if (!response.ok) {
    const status = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw new HttpError(body?.message ?? `Mercado Pago retornou ${response.status}.`, status);
  }
  return body as T;
}

function originFor(req: Request): string {
  const origin = req.headers.get("origin") ?? Deno.env.get("APP_URL") ?? "https://startex.com.br";
  return origin.replace(/\/+$/, "");
}

function appUrl(value: string | undefined, fallbackPath: string, origin: string): string {
  if (!value) return `${origin}${fallbackPath}`;
  try {
    const parsed = new URL(value, origin);
    return parsed.origin === origin ? parsed.toString() : `${origin}${fallbackPath}`;
  } catch {
    return `${origin}${fallbackPath}`;
  }
}

function checkoutUrl(body: CheckoutResponse, sandbox: boolean): string {
  const url = sandbox
    ? (body.sandbox_init_point ?? body.init_point)
    : (body.init_point ?? body.sandbox_init_point);
  if (!url) throw new HttpError("Mercado Pago não retornou a URL de pagamento.", 502);
  return url;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (req.method !== "POST") throw new HttpError("Método não permitido.", 405);

    const admin = adminClient();
    const user = await requireUser(req, admin);
    const body = (await req.json().catch(() => ({}))) as {
      kind?: string;
      productId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };
    const origin = originFor(req);
    const settings = await loadSettings(admin);
    if (!settings) throw new HttpError("Configuração do Mercado Pago não encontrada.", 404);
    if (!settings.enabled) throw new HttpError("Integração Mercado Pago desativada.", 400);
    if (!settings.access_token)
      throw new HttpError("Access Token do Mercado Pago não configurado.", 400);
    const notificationUrl =
      settings.notification_url || `${origin}/functions/v1/mercadopago-webhook`;
    const testMode = isMercadoPagoTestToken(settings.access_token);

    if (body.kind === "subscription") {
      if (!settings.subscription_plan_id)
        throw new HttpError(
          "Plano de assinatura não sincronizado. Use a aba Mercado Pago no admin.",
          400,
        );
      if (!user.email) throw new HttpError("E-mail do usuário não disponível.", 400);
      const payload = buildSubscriptionCheckoutPayload({
        planId: settings.subscription_plan_id,
        reason: "Assinatura Startex",
        payerEmail: testMode ? null : user.email,
        payerName: testMode ? null : ((user.user_metadata?.["nome"] as string | undefined) ?? null),
        externalReference: `subscription:${user.id}`,
        backUrl: appUrl(body.successUrl, "/trilhas?assinatura=ok", origin),
        notificationUrl,
      });
      const response = await mpRequest<CheckoutResponse>(
        settings.access_token,
        "/preapproval",
        payload,
      );
      return json({ url: checkoutUrl(response, testMode) });
    }

    if (body.kind === "product") {
      if (!body.productId) throw new HttpError("productId é obrigatório.", 400);
      const { data, error } = await admin
        .from("products")
        .select("*")
        .eq("id", body.productId)
        .limit(1);
      if (error) throw new Error(error.message);
      const product = data?.[0] as ProductRow | undefined;
      if (!product) throw new HttpError("Produto não encontrado.", 404);

      const { data: hasAccess, error: accessError } = await admin.rpc("has_active_access", {
        _user_id: user.id,
      });
      if (accessError) throw new Error(accessError.message);
      const priceCents =
        hasAccess === true && typeof product.member_price_cents === "number"
          ? product.member_price_cents
          : product.price_cents;

      const payload = buildProductPreference({
        productId: product.id,
        title: product.name,
        description: product.description,
        priceCents,
        externalReference: `product:${product.id}:user:${user.id}`,
        notificationUrl,
        statementDescriptor: settings.statement_descriptor,
        successUrl: appUrl(body.successUrl, "/meus-produtos?compra=ok", origin),
        cancelUrl: appUrl(body.cancelUrl, "/loja", origin),
      });
      const response = await mpRequest<CheckoutResponse>(
        settings.access_token,
        "/checkout/preferences",
        payload,
      );
      return json({ url: checkoutUrl(response, testMode) });
    }

    throw new HttpError("Operação de checkout inválida.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof HttpError ? error.status : 500;
    return json({ ok: false, error: message }, status);
  }
});
