import { headers } from "next/headers";
import { LoginForm } from "./login-form";

// Капча включается, если задан TURNSTILE_SITE_KEY (и в Supabase включена защита от ботов).
export default async function LoginPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <LoginForm captchaSiteKey={process.env.TURNSTILE_SITE_KEY || null} nonce={nonce} />;
}
