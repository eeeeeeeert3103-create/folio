import type { NextConfig } from "next";

const securityHeaders = [
  // Сайт нельзя встроить в чужую страницу (защита от кликджекинга).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Браузер не угадывает тип файла — только тот, что указал сервер.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Чужим сайтам уходит только домен, без полного адреса страницы.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
