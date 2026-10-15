import type { CookieOptionsWithName } from "@supabase/ssr";

// Сессия доступна только серверу: скрипты на странице не могут её прочитать.
// Поэтому все обращения к Supabase идут с сервера, браузерного клиента нет.
export const cookieOptions: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
