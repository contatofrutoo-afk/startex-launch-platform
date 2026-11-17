import { supabase } from "@/integrations/supabase/client";

const EXTERNAL_PREFIXES = ["/", "http://", "https://", "data:", "blob:"];

export function isExternalUrl(value: string): boolean {
  return EXTERNAL_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export async function resolveStorageUrl(
  value: string | null | undefined,
  bucket = "capas",
  expiresIn = 60 * 60,
): Promise<string | null> {
  if (!value) return null;
  if (isExternalUrl(value)) return value;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(value, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
