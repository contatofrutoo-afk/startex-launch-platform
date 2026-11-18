import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkoutOrigin, sameOriginUrl } from "@/lib/mercadopago-pricing";

const checkoutInput = z.object({
  kind: z.enum(["subscription", "product"]),
  productId: z.string().uuid().optional(),
  successUrl: z.string().max(500).optional(),
  cancelUrl: z.string().max(500).optional(),
});

export type MercadoPagoCheckoutResult = { url: string } | { error: string };

function friendly(error: unknown): string {
  return error instanceof Error && error.name === "MercadoPagoError"
    ? error.message
    : "Não foi possível iniciar o pagamento no Mercado Pago.";
}

export const createMercadoPagoCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutInput.parse(input))
  .handler(async ({ data, context }): Promise<MercadoPagoCheckoutResult> => {
    try {
      const mp = await import("@/lib/mercadopago.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const settings = mp.requireUsableSettings(await mp.loadMercadoPagoSettings(supabaseAdmin));
      const origin = checkoutOrigin(getRequestHeader("origin"));

      if (data.kind === "subscription") {
        const email = typeof context.claims["email"] === "string" ? context.claims["email"] : "";
        if (!email) return { error: "Sua conta não tem e-mail cadastrado." };
        const url = await mp.createSubscriptionCheckout({
          settings,
          userId: context.userId,
          email,
          backUrl: sameOriginUrl(data.successUrl, "/trilhas?assinatura=ok", origin),
          cancelUrl: sameOriginUrl(data.cancelUrl, "/minha-conta", origin),
        });
        return { url };
      }

      if (!data.productId) return { error: "Produto não informado." };
      const url = await mp.createProductCheckout({
        admin: supabaseAdmin,
        settings,
        userId: context.userId,
        productId: data.productId,
        successUrl: sameOriginUrl(data.successUrl, "/meus-produtos?compra=ok", origin),
        cancelUrl: sameOriginUrl(data.cancelUrl, "/loja", origin),
      });
      return { url };
    } catch (error) {
      console.error("[mercadopago] checkout", error);
      return { error: friendly(error) };
    }
  });

const syncInput = z.object({
  kind: z.enum(["product", "subscription", "all"]).default("all"),
  productId: z.string().uuid().optional(),
});

export type MercadoPagoSyncResult = {
  ok: boolean;
  products: number;
  subscription: boolean;
  planId?: string | null;
  error?: string;
};

/** Valida as credenciais e mantém o plano da assinatura com o preço atual (somente admin). */
export const syncMercadoPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => syncInput.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<MercadoPagoSyncResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) return { ok: false, products: 0, subscription: false, error: "Acesso restrito a administradores." };
    try {
      const mp = await import("@/lib/mercadopago.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const settings = mp.requireUsableSettings(await mp.loadMercadoPagoSettings(supabaseAdmin));
      await mp.verifyCredentials(settings);
      if (data.kind === "product") {
        // Preferências de produto são criadas no momento da compra, com o preço atual.
        return { ok: true, products: 1, subscription: false };
      }
      const origin = checkoutOrigin(getRequestHeader("origin"));
      const planId = await mp.syncSubscriptionPlan(supabaseAdmin, settings, origin);
      let products = 0;
      if (data.kind === "all") {
        const { count } = await supabaseAdmin
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("active", true);
        products = count ?? 0;
      }
      return { ok: true, products, subscription: true, planId };
    } catch (error) {
      console.error("[mercadopago] sync", error);
      return { ok: false, products: 0, subscription: false, error: friendly(error) };
    }
  });
