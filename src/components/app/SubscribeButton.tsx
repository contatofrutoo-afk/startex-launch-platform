import { useState } from "react";
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
import { SUBSCRIPTION_PRICE_CENTS, formatBRL } from "@/lib/format";

export function SubscribeButton({ size = "default", className }: Pick<ButtonProps, "size" | "className">) {
  const [open, setOpen] = useState(false);
  const price = formatBRL(SUBSCRIPTION_PRICE_CENTS, { compact: true });
  return (
    <>
      <Button variant="hero" size={size} className={className} onClick={() => setOpen(true)}>
        <Lock /> Assinar por {price}/mês
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinatura Startex — {price}/mês</DialogTitle>
            <DialogDescription>
              O pagamento online está sendo configurado e ficará disponível em breve. Enquanto isso,
              a equipe Startex pode liberar o seu acesso manualmente.
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
