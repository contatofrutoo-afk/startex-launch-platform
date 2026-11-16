import horizontal from "@/assets/startex-logo-horizontal.png.asset.json";
import stacked from "@/assets/startex-logo-light.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({
  variant = "horizontal",
  className,
}: {
  variant?: "horizontal" | "stacked";
  className?: string;
}) {
  if (variant === "stacked") {
    return (
      <img
        src={stacked.url}
        alt="Startex — Network de Empreendedores"
        width={324}
        height={228}
        className={cn("h-auto w-40", className)}
      />
    );
  }
  return (
    <img
      src={horizontal.url}
      alt="Startex — Network de Empreendedores"
      width={477}
      height={93}
      className={cn("h-9 w-auto", className)}
    />
  );
}
