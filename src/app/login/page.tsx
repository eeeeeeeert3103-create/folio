"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="card w-full max-w-sm">
        {status === "sent" ? (
          <div className="text-center">
            <h1 className="text-xl font-semibold">Проверьте почту</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Мы отправили ссылку для входа на <b>{email}</b>. Откройте её в этом же браузере.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold">Вход в Folio</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Без пароля: пришлём ссылку на почту. Аккаунт создастся автоматически.
            </p>
            <label className="label mt-6" htmlFor="email">
              Почта
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              className="input"
              placeholder="you@university.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {status === "error" && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button className="btn-primary mt-4 w-full" disabled={status === "sending"}>
              {status === "sending" ? "Отправляем…" : "Получить ссылку"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
