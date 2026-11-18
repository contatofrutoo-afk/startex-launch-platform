export type ProductType = "ebook_pdf" | "planilha_excel" | "apresentacao_ppt" | "ferramenta_html";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  member_price_cents: number | null;
  type: ProductType;
  file_path: string | null;
  cover_url: string | null;
  active: boolean;
  created_at?: string;
  mercadopago_preference_id?: string | null;
  mercadopago_member_preference_id?: string | null;
  mercadopago_synced_at?: string | null;
};

export type OrderStatus = "pending" | "paid" | "canceled" | "refunded";

export type Order = {
  id: string;
  user_id: string;
  product_id: string;
  status: OrderStatus;
  provider: string | null;
  provider_session_id: string | null;
  provider_payment_intent_id: string | null;
  amount_cents: number | null;
  created_at: string;
  updated_at?: string;
  product?: Product | null;
};

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  ebook_pdf: "Ebook (PDF)",
  planilha_excel: "Planilha Excel",
  apresentacao_ppt: "Apresentação PowerPoint",
  ferramenta_html: "Ferramenta online",
};

export const PRODUCT_FILTERS: { value: "todos" | ProductType; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ebook_pdf", label: "Ebooks" },
  { value: "planilha_excel", label: "Planilhas Excel" },
  { value: "apresentacao_ppt", label: "Apresentações PowerPoint" },
  { value: "ferramenta_html", label: "Ferramentas online" },
];

export function productTypeLabel(type: string): string {
  return PRODUCT_TYPE_LABEL[type as ProductType] ?? type;
}

export function effectivePriceCents(
  product: Pick<Product, "price_cents" | "member_price_cents">,
  hasActiveSubscription: boolean,
): number {
  if (hasActiveSubscription && typeof product.member_price_cents === "number")
    return product.member_price_cents;
  return product.price_cents;
}

export function isDownloadableProduct(type: string): boolean {
  return type === "ebook_pdf" || type === "planilha_excel" || type === "apresentacao_ppt";
}
