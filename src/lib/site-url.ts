const PRODUCTION_URL = "https://folio-mu-jet.vercel.app";

// Build share and auth links from deployment configuration, never from the Host header.
export function getSiteUrl(): string {
  const configured =
    process.env.FOLIO_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  const fallback = process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000";

  if (!configured) return fallback;

  try {
    const candidate = configured.includes("://") ? configured : `https://${configured}`;
    const url = new URL(candidate);
    if (url.username || url.password) return fallback;
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return fallback;
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}
