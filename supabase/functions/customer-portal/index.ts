// Stub: portal do cliente Stripe (cancelar/atualizar cartão). Requer STRIPE_SECRET_KEY.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async () => new Response(JSON.stringify({ error: "not_configured" }), { status: 501, headers: { "Content-Type": "application/json" } }));
