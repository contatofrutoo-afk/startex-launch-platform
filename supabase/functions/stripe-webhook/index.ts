// Stub: webhook Stripe — validar STRIPE_WEBHOOK_SECRET e atualizar subscriptions/orders via service_role.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async () => new Response(JSON.stringify({ received: false, message: "Configure webhook Stripe no Lovable." }), { status: 501, headers: { "Content-Type": "application/json" } }));
