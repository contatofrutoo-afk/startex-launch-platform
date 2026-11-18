import { Lock } from "lucide-react";
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
import { useSubscriptionCheckout } from "@/hooks/use-subscription-checkout";

type SubscribeButtonProps = Pick<ButtonProps, "size" | "className"> & {
  label?: string;
};

export function SubscribeButton({ size = "default", className, label }: SubscribeButtonProps) {
  const priceCents = useSubscriptionPriceCents();
  const price = formatBRL(priceCents, { compact: true });
  const { startCheckout, loading, unavailable, setUnavailable } = useSubscriptionCheckout();

  return (
    <>
      <Button
        variant="hero"
        size={size}
        className={className}
        onClick={() => void startCheckout()}
        disabled={loading}
      >
        <Lock /> {loading ? "Abrindo pagamento..." : (label ?? `Assinar por ${price}/mês`)}
      </Button>
      <Dialog open={unavailable} onOpenChange={setUnavailable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinatura Startex — {price}/mês</DialogTitle>
            <DialogDescription>
              O pagamento via Mercado Pago não está disponível neste momento. Tente novamente em
              instantes ou fale com a equipe Startex para liberação manual.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild variant="outline">
              <a href="mailto:contato@startex.com.br?subject=Quero%20assinar%20a%20Startex">
                Falar com a equipe
              </a>
            </Button>
            <Button onClick={() => setUnavailable(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
