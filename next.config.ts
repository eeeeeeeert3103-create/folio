import type { NextConfig } from "next";

// Content-Security-Policy задаётся в src/proxy.ts — ей нужен свой nonce на каждый запрос.
const securityHeaders = [
  // Сайт нельзя встроить в чужую страницу (защита от кликджекинга).
  { key: "X-Frame-Options", value: "DENY" },
  // Браузер не угадывает тип файла — только тот, что указал сервер.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Чужим сайтам уходит только домен, без полного адреса страницы.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Картинки загружаются через серверное действие: до 5 МБ плюс запас на форму.
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
