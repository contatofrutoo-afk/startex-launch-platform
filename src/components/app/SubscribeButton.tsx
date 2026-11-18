import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL } from "@/lib/format";
import { useSubscriptionPriceCents } from "@/hooks/use-subscription-price";
import { getPaymentAdapter } from "@/lib/payments";

export function SubscribeButton({
  size = "default",
  className,
}: Pick<ButtonProps, "size" | "className">) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const priceCents = useSubscriptionPriceCents();
  const price = formatBRL(priceCents, { compact: true });

  async function startCheckout() {
    setLoading(true);
    try {
      const adapter = getPaymentAdapter();
      const res = await adapter.createCheckout({
        kind: "subscription",
        successUrl: `${window.location.origin}/trilhas?assinatura=ok`,
        cancelUrl: `${window.location.origin}/minha-conta`,
      });
      if ("unavailable" in res) {
        setOpen(true);
      } else {
        window.location.href = res.url;
      }
    } catch {
      toast.error("Não foi possível iniciar o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="hero"
        size={size}
        className={className}
        onClick={startCheckout}
        disabled={loading}
      >
        <Lock /> {loading ? "Abrindo pagamento..." : `Assinar por ${price}/mês`}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinatura Startex — {price}/mês</DialogTitle>
            <DialogDescription>
              Pagamento online via Stripe (modo teste) ainda não configurado neste ambiente. A
              arquitetura já está preparada (checkout, webhooks, portal). Enquanto isso, a equipe
              Startex pode liberar seu acesso manualmente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild variant="outline">
              <a href="mailto:contato@startex.com.br?subject=Quero%20assinar%20a%20Startex">
                Falar com a equipe
              </a>
            </Button>
            <Button onClick={() => setOpen(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
