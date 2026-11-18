import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  isActiveSubscriptionStatus,
  isInactiveSubscriptionStatus,
  subscriptionPeriodEnd,
} from "../_shared/mercadopago-pricing.ts";

type SettingsRow = {
  enabled: boolean;
  access_token: string;
  webhook_secret: string;
};

type Notification = {
  type?: string;
  data?: { id?: string | number };
};

type MpSubscription = {
  status?: string;
  external_reference?: string;
  next_retry_date?: string;
};

type MpPayment = {
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
  subscription_id?: string | number;
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

async function loadSettings(admin: ReturnType<typeof adminClient>): Promise<SettingsRow | null> {
  const { data, error } = await admin
    .from("payment_settings")
    .select("*")
    .eq("provider", "mercadopago")
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0] as SettingsRow | undefined) ?? null;
}

async function mpGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as T & { message?: string }) : null;
  if (!response.ok) {
    const status = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw new HttpError(body?.message ?? `Mercado Pago retornou ${response.status}.`, status);
  }
  return body as T;
}

async function verifySignature(req: Request, raw: string, secret: string): Promise<boolean> {
  if (!secret) return true;
  const header = req.headers.get("x-signature") ?? "";
  const ts = header.match(/ts=(\d+)/)?.[1];
  const provided = header.match(/v1=([a-f0-9]+)/i)?.[1];
  if (!ts || !provided) return false;

  let dataId = "";
  try {
    dataId = String((JSON.parse(raw) as Notification).data?.id ?? "");
  } catch {
    return false;
  }

  const requestId = req.headers.get("x-request-id") ?? "";
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return expected === provided.toLowerCase();
}

async function syncSubscription(
  admin: ReturnType<typeof adminClient>,
  settings: SettingsRow,
  id: string,
): Promise<void> {
  const subscription = await mpGet<MpSubscription>(settings.access_token, `/preapproval/${id}`);
  const reference = String(subscription.external_reference ?? "");
  if (!reference.startsWith("subscription:")) return;
  const userId = reference.slice("subscription:".length);
  if (!userId) return;

  const active = isActiveSubscriptionStatus(subscription.status);
  if (!active && !isInactiveSubscriptionStatus(subscription.status)) return;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      status: active ? "active" : "canceled",
      current_period_end: active ? subscriptionPeriodEnd(subscription.next_retry_date) : null,
      provider: "mercadopago",
      provider_subscription_id: id,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

async function syncPayment(
  admin: ReturnType<typeof adminClient>,
  settings: SettingsRow,
  id: string,
): Promise<void> {
  const payment = await mpGet<MpPayment>(settings.access_token, `/payments/${id}`);
  if (payment.status !== "approved") return;

  const reference = String(payment.external_reference ?? "");
  if (reference.startsWith("subscription:")) {
    const userId = reference.slice("subscription:".length);
    if (!userId) return;
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        provider: "mercadopago",
        provider_subscription_id:
          payment.subscription_id === undefined ? undefined : String(payment.subscription_id),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return;
  }

  const match = reference.match(/^product:([^:]+)(?::user:([^:]+))?$/);
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
    ? await admin
        .from("orders")
        .update(order)
        .eq("id", (existing as { id: string }).id)
    : await admin.from("orders").insert(order);
  if (error) throw new Error(error.message);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (req.method !== "POST") throw new HttpError("Método não permitido.", 405);

    const admin = adminClient();
    const settings = await loadSettings(admin);
    if (!settings?.enabled || !settings.access_token)
      throw new HttpError("Integração Mercado Pago desativada.", 400);

    const raw = await req.text();
    if (!(await verifySignature(req, raw, settings.webhook_secret)))
      throw new HttpError("Assinatura inválida.", 401);

    const notification = JSON.parse(raw) as Notification;
    const id = notification.data?.id;
    if (id == null) return json({ received: true });

    if (notification.type === "subscription_preapproval")
      await syncSubscription(admin, settings, String(id));
    else if (notification.type === "payment") await syncPayment(admin, settings, String(id));

    return json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof HttpError ? error.status : 500;
    return json({ ok: false, error: message }, status);
  }
});
