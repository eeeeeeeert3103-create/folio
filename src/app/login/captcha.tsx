"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

type Props = { siteKey: string; nonce?: string; resetKey: unknown };

// Cloudflare Turnstile: проверка «не робот» перед отправкой письма со ссылкой.
// Токен кладём в скрытое поле, сервер передаёт его в Supabase, а тот проверяет его у Cloudflare.
export function Captcha({ siteKey, nonce, resetKey }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const turnstile = window.turnstile;
    if (!ready || !box.current || !turnstile) return;
    const id = turnstile.render(box.current, {
      sitekey: siteKey,
      callback: (t: string) => setToken(t),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
    widget.current = id;
    return () => {
      turnstile.remove(id);
      widget.current = null;
    };
  }, [ready, siteKey]);

  // Токен одноразовый: после каждой попытки входа просим новый.
  useEffect(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        nonce={nonce}
        onReady={() => setReady(true)}
      />
      <div ref={box} className="mt-4 min-h-[65px]" />
      <input type="hidden" name="captcha" value={token} />
    </>
  );
}
