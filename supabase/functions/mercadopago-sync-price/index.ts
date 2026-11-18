import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildProductPreference,
  buildSubscriptionPlanPayload,
} from "../_shared/mercadopago-pricing.ts";

type SettingsRow = {
  access_token: string;
  enabled: boolean;
  notification_url: string;
  statement_descriptor: string;
  subscription_plan_id: string;
  subscription_price_cents: number;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  member_price_cents: number | null;
  mercadopago_preference_id: string | null;
  mercadopago_member_preference_id: string | null;
};

type PreferenceResponse = { id?: string };

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function shouldRecreateExternalId(error: unknown): boolean {
  return error instanceof HttpError && [401, 403, 404].includes(error.status);
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

async function requireAdmin(req: Request, admin: ReturnType<typeof adminClient>): Promise<void> {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError("Autenticação necessária.", 401);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError("Autenticação inválida.", 401);
  const { data: isAdmin, error: roleError } = await admin.rpc("has_role", {
    _user_id: data.user.id,
    _role: "admin",
  });
  if (roleError || isAdmin !== true) throw new HttpError("Acesso restrito a administradores.", 403);
}

async function mpRequest<T>(
  accessToken: string,
  path: string,
  method: "GET" | "POST" | "PUT" = "GET",
  payload?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as T & { message?: string }) : null;
  if (!response.ok) {
    const status = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw new HttpError(body?.message ?? `Mercado Pago retornou ${response.status}.`, status);
  }
  return body as T;
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

async function upsertPreference(
  accessToken: string,
  existingId: string | null,
  payload: Record<string, unknown>,
): Promise<string> {
  let response: PreferenceResponse | undefined;
  if (existingId) {
    try {
      response = await mpRequest<PreferenceResponse>(
        accessToken,
        `/checkout/preferences/${existingId}`,
        "PUT",
        payload,
      );
    } catch (error) {
      if (!shouldRecreateExternalId(error)) throw error;
    }
  }
  if (!response)
    response = await mpRequest<PreferenceResponse>(
      accessToken,
      "/checkout/preferences",
      "POST",
      payload,
    );
  if (!response.id) throw new HttpError("Mercado Pago não retornou o ID da preferência.", 502);
  return response.id;
}

function originFor(req: Request): string {
  const origin = req.headers.get("origin") ?? Deno.env.get("APP_URL") ?? "https://startex.com.br";
  return origin.replace(/\/+$/, "");
}

async function syncProduct(
  admin: ReturnType<typeof adminClient>,
  settings: SettingsRow,
  product: ProductRow,
  origin: string,
): Promise<string> {
  const regularId = await upsertPreference(
    settings.access_token,
    product.mercadopago_preference_id,
    buildProductPreference({
      productId: product.id,
      title: product.name,
      description: product.description,
      priceCents: Math.max(0, Number(product.price_cents)),
      externalReference: `product:${product.id}`,
      notificationUrl: settings.notification_url || `${origin}/functions/v1/mercadopago-webhook`,
      statementDescriptor: settings.statement_descriptor,
      successUrl: `${origin}/meus-produtos?compra=ok`,
      cancelUrl: `${origin}/loja`,
    }),
  );

  let memberId: string | null = null;
  if (typeof product.member_price_cents === "number" && product.member_price_cents >= 0) {
    memberId = await upsertPreference(
      settings.access_token,
      product.mercadopago_member_preference_id,
      buildProductPreference({
        productId: `${product.id}:member`,
        title: `${product.name} (preço assinante)`,
        description: product.description,
        priceCents: product.member_price_cents,
        externalReference: `product:${product.id}:member`,
        notificationUrl: settings.notification_url || `${origin}/functions/v1/mercadopago-webhook`,
        statementDescriptor: settings.statement_descriptor,
        successUrl: `${origin}/meus-produtos?compra=ok`,
        cancelUrl: `${origin}/loja`,
      }),
    );
  }

  const { error } = await admin
    .from("products")
    .update({
      mercadopago_preference_id: regularId,
      mercadopago_member_preference_id: memberId,
      mercadopago_synced_at: new Date().toISOString(),
    })
    .eq("id", product.id);
  if (error) throw new Error(error.message);
  return product.id;
}

async function syncSubscription(
  admin: ReturnType<typeof adminClient>,
  settings: SettingsRow,
  origin: string,
): Promise<string> {
  const payload = buildSubscriptionPlanPayload({
    reason: "Assinatura Startex",
    priceCents: Math.max(0, Number(settings.subscription_price_cents)),
    backUrl: `${origin}/trilhas?assinatura=ok`,
  });

  if (settings.subscription_plan_id) {
    try {
      await mpRequest(
        settings.access_token,
        `/preapproval_plan/${settings.subscription_plan_id}`,
        "PUT",
        payload,
      );
      return settings.subscription_plan_id;
    } catch (error) {
      if (!shouldRecreateExternalId(error)) throw error;
    }
  }

  const created = await mpRequest<PreferenceResponse>(
    settings.access_token,
    "/preapproval_plan",
    "POST",
    payload,
  );
  if (!created.id) throw new HttpError("Mercado Pago não retornou o ID do plano.", 502);
  const { error } = await admin
    .from("payment_settings")
    .update({ subscription_plan_id: created.id })
    .eq("provider", "mercadopago");
  if (error) throw new Error(error.message);
  return created.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = adminClient();
    await requireAdmin(req, admin);
    const body = (await req.json().catch(() => ({}))) as { kind?: string; productId?: string };
    const kind = body.kind ?? "all";
    const origin = originFor(req);
    const settings = await loadSettings(admin);
    if (!settings) throw new HttpError("Configuração do Mercado Pago não encontrada.", 404);
    if (!settings.enabled) throw new HttpError("Integração Mercado Pago desativada.", 400);
    if (!settings.access_token)
      throw new HttpError("Access Token do Mercado Pago não configurado.", 400);

    if (kind === "product") {
      if (!body.productId) throw new HttpError("productId é obrigatório.", 400);
      const { data, error } = await admin
        .from("products")
        .select("*")
        .eq("id", body.productId)
        .limit(1);
      if (error) throw new Error(error.message);
      const product = data?.[0] as ProductRow | undefined;
      if (!product) throw new HttpError("Produto não encontrado.", 404);
      await syncProduct(admin, settings, product, origin);
      return json({ ok: true, products: 1, subscription: false });
    }

    if (kind === "subscription") {
      const planId = await syncSubscription(admin, settings, origin);
      return json({ ok: true, products: 0, subscription: true, planId });
    }

    if (kind === "all") {
      const { data, error } = await admin
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const products = (data ?? []) as ProductRow[];
      for (const product of products) await syncProduct(admin, settings, product, origin);
      const planId = await syncSubscription(admin, settings, origin);
      return json({ ok: true, products: products.length, subscription: true, planId });
    }

    throw new HttpError("Operação de sincronização inválida.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof HttpError ? error.status : 500;
    return json({ ok: false, error: message }, status);
  }
});
