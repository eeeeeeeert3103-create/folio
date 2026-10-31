import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

// Сюда ведёт ссылка из письма: меняем одноразовый код на сессию.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getSiteUrl();
  const code = searchParams.get("code");

  // Пускаем только на страницы своего сайта: «//evil.com» или «/\evil.com»
  // браузер воспринял бы как чужой адрес.
  const target = new URL(searchParams.get("next") ?? "/dashboard", origin);
  const next = target.origin === origin ? target.pathname + target.search : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
