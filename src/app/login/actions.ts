"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; sentTo?: string };

const emailSchema = z.email("Проверьте адрес почты.").max(200);

// Вход по ссылке из письма. Идёт через сервер, чтобы сессия жила в httpOnly-куках.
// Частоту писем ограничивает сам Supabase (Authentication → Rate Limits), ботов отсекает капча.
export async function sendMagicLink(_: LoginState, fd: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(String(fd.get("email") ?? "").trim());
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Если капча включена, без её токена письмо не отправляем. Сам токен проверяет Supabase.
  const captchaToken = String(fd.get("captcha") ?? "").slice(0, 4096) || undefined;
  if (process.env.TURNSTILE_SITE_KEY && !captchaToken) return { error: "Подтвердите, что вы не робот." };

  // Next.js сам отклоняет серверные действия с чужого Origin, так что ему можно доверять.
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard`, captchaToken },
  });

  if (error) {
    if (error.status === 429) return { error: "Слишком много попыток. Подождите немного и попробуйте снова." };
    if (error.code === "captcha_failed") return { error: "Проверка «не робот» не прошла. Попробуйте ещё раз." };
    console.error("Ошибка входа:", error);
    return { error: "Не получилось отправить письмо. Попробуйте ещё раз." };
  }
  return { sentTo: parsed.data };
}
