import { createFileRoute } from "@tanstack/react-router";
import { parseSignatureHeader, webhookSignatureManifest } from "@/lib/mercadopago-pricing";

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type Notification = { type?: string; topic?: string; action?: string; data?: { id?: string | number } };

export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const raw = await request.text();
        let body: Notification = {};
        try {
          body = raw ? (JSON.parse(raw) as Notification) : {};
        } catch {
          body = {};
        }
        const dataId = String(url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? body.data?.id ?? "")
          .slice(0, 64);
        const type = String(body.type ?? url.searchParams.get("type") ?? body.topic ?? url.searchParams.get("topic") ?? "");
        if (!dataId || !/^[\w-]+$/.test(dataId)) return Response.json({ received: true });

        const mp = await import("@/lib/mercadopago.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const settings = await mp.loadMercadoPagoSettings(supabaseAdmin);
        if (!settings?.enabled || !settings.accessToken) {
          return Response.json({ error: "disabled" }, { status: 503 });
        }

        if (settings.webhookSecret) {
          const parsed = parseSignatureHeader(request.headers.get("x-signature") ?? "");
          if (!parsed) return Response.json({ error: "invalid signature" }, { status: 401 });
          const manifest = webhookSignatureManifest({
            dataId,
            requestId: request.headers.get("x-request-id") ?? "",
            ts: parsed.ts,
          });
          const expected = await hmacHex(settings.webhookSecret, manifest);
          if (!timingSafeEqual(expected, parsed.v1)) {
            return Response.json({ error: "invalid signature" }, { status: 401 });
          }
        }

        try {
          // O estado é sempre relido da API do Mercado Pago; a notificação só traz o ID.
          if (type === "subscription_preapproval" || type === "preapproval") {
            await mp.syncPreapproval(supabaseAdmin, settings, dataId);
          } else if (type === "subscription_authorized_payment" || type === "authorized_payment") {
            await mp.syncAuthorizedPayment(supabaseAdmin, settings, dataId);
          } else if (type === "payment") {
            await mp.syncPayment(supabaseAdmin, settings, dataId);
          }
          return Response.json({ received: true });
        } catch (error) {
          console.error("[mercadopago] webhook", type, error);
          return Response.json({ error: "processing failed" }, { status: 500 });
        }
      },
    },
  },
});
