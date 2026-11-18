import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPaymentAdapter } from "@/lib/payments";

export const SUBSCRIPTION_CHECKOUT_REDIRECT = "/?checkout=subscription";

export function useSubscriptionCheckout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const startCheckout = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/cadastro", search: { redirect: SUBSCRIPTION_CHECKOUT_REDIRECT } });
        return;
      }
      const adapter = getPaymentAdapter();
      const res = await adapter.createCheckout({
        kind: "subscription",
        successUrl: `${window.location.origin}/trilhas?assinatura=ok`,
        cancelUrl: `${window.location.origin}/minha-conta`,
      });
      if ("unavailable" in res) setUnavailable(true);
      else window.location.href = res.url;
    } catch {
      toast.error("Não foi possível iniciar o pagamento.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  return { startCheckout, loading, unavailable, setUnavailable };
}

export function useResumeSubscriptionCheckout() {
  const navigate = useNavigate();
  const { startCheckout } = useSubscriptionCheckout();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (new URLSearchParams(window.location.search).get("checkout") !== "subscription") return;
    started.current = true;
    navigate({ to: "/", replace: true });
    void startCheckout();
  }, [navigate, startCheckout]);
}
