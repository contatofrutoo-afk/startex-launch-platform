export type PaymentProvider = "stripe" | "mercadopago" | "manual" | "pix_future";

export type CheckoutKind = "subscription" | "product";

export interface CheckoutRequest {
  kind: CheckoutKind;
  productId?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentAdapter {
  provider: PaymentProvider;
  createCheckout(
    req: CheckoutRequest,
  ): Promise<{ url: string } | { unavailable: true; message: string }>;
  openCustomerPortal?(
    returnUrl: string,
  ): Promise<{ url: string } | { unavailable: true; message: string }>;
}

export const STRIPE_PRICE_SUBSCRIPTION_BRL_297 = "price_startex_297_brl_monthly";

export function paymentsConfigured(): boolean {
  return import.meta.env.MODE === "demo" || Boolean(import.meta.env["VITE_STRIPE_PUBLISHABLE_KEY"]);
}

export const stripeAdapter: PaymentAdapter = {
  provider: "stripe",
  async createCheckout(req) {
    if (!paymentsConfigured()) {
      return {
        unavailable: true,
        message:
          "Pagamentos online em configuração (Stripe modo teste). Fale com a equipe para liberação manual.",
      };
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("create-checkout", { body: req });
    if (error || !data?.url)
      return {
        unavailable: true,
        message: "Não foi possível iniciar o checkout. Tente novamente.",
      };
    return { url: data.url as string };
  },
  async openCustomerPortal(returnUrl) {
    if (!paymentsConfigured())
      return { unavailable: true, message: "Portal do cliente indisponível no momento." };
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("customer-portal", {
      body: { returnUrl },
    });
    if (error || !data?.url)
      return { unavailable: true, message: "Não foi possível abrir o portal." };
    return { url: data.url as string };
  },
};

export const mercadopagoAdapter: PaymentAdapter = {
  provider: "mercadopago",
  async createCheckout(req) {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("mercadopago-checkout", { body: req });
    if (error || !data?.url)
      return {
        unavailable: true,
        message: error?.message ?? "Não foi possível iniciar o pagamento no Mercado Pago.",
      };
    return { url: data.url as string };
  },
  async openCustomerPortal() {
    return {
      unavailable: true,
      message: "Para alterar ou cancelar sua assinatura, fale com a equipe Startex.",
    };
  },
};

export function getPaymentAdapter(): PaymentAdapter {
  return mercadopagoAdapter;
}
