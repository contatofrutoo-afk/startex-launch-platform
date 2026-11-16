// Stub: implantar/configurar no Lovable. Ver docs/LOVABLE_SETUP.md e src/lib/payments/.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });
  try {
    // TODO: STRIPE_SECRET_KEY / STRIPE_PRICE_SUBSCRIPTION_297 -> criar sessão (assinatura R$297 BRL ou produto)
    return json({ error: "not_configured", message: "Configure Stripe no Lovable (secrets + função)." }, 501);
  } catch (e) { return json({ error: String(e) }, 500); }
});
function cors() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey" }; }
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors() } }); }
