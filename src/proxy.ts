import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy: браузер выполнит только скрипты с одноразовым nonce,
// который сервер выдаёт на каждый запрос. Чужой внедрённый скрипт его не знает.
// Капча Cloudflare Turnstile грузит свой скрипт и рамку — разрешаем их, только если она включена.
const captcha = process.env.TURNSTILE_SITE_KEY ? " https://challenges.cloudflare.com" : "";

function contentSecurityPolicy(nonce: string) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return [
    "default-src 'self'",
    // 'unsafe-eval' только при разработке: он нужен инструментам отладки React.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${captcha}${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabase}`,
    "font-src 'self'",
    `connect-src 'self'${captcha}${isDev ? " ws:" : ""}`,
    `frame-src 'self'${captcha}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);

  // Next.js берёт nonce из заголовка запроса и проставляет его своим скриптам.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = await updateSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      // Предзагрузки не рендерят страницу — nonce им не нужен.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
