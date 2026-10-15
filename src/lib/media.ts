import type { SupabaseClient } from "@supabase/supabase-js";

// Файлы лежат в приватном бакете media по пути «<user_id>/<uuid>.<ext>».
export const MEDIA_BUCKET = "media";
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp|gif)$/;

// Ссылки на картинки временные: живут час, страницы рендерятся заново на каждый запрос.
const SIGNED_URL_TTL = 60 * 60;

// Тип файла определяем по его первым байтам, а не по тому, что сообщил браузер.
export function detectImageType(bytes: Uint8Array): { ext: string; mime: string } | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ext: "png", mime: "image/png" };
  if (starts([0xff, 0xd8, 0xff])) return { ext: "jpg", mime: "image/jpeg" };
  if (starts([0x47, 0x49, 0x46, 0x38])) return { ext: "gif", mime: "image/gif" };
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return { ext: "webp", mime: "image/webp" };
  return null;
}

// Временные ссылки на несколько файлов разом. Права проверяет база:
// посторонний получит ссылку, только если картинка показана на публичной странице.
export async function signMedia(
  supabase: SupabaseClient,
  paths: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  if (unique.length === 0) return {};

  const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(unique, SIGNED_URL_TTL);
  const urls: Record<string, string> = {};
  for (const d of data ?? []) {
    if (d.path && d.signedUrl && !d.error) urls[d.path] = d.signedUrl;
  }
  return urls;
}

export async function removeMedia(supabase: SupabaseClient, paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length > 0) await supabase.storage.from(MEDIA_BUCKET).remove(list);
}
