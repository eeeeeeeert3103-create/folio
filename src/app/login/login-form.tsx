"use client";

import { useActionState } from "react";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { sendMagicLink, type LoginState } from "./actions";
import { Captcha } from "./captcha";

type Props = { captchaSiteKey: string | null; nonce?: string };

export function LoginForm({ captchaSiteKey, nonce }: Props) {
  const [state, action] = useActionState<LoginState, FormData>(sendMagicLink, {});

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="card w-full max-w-sm">
        {state.sentTo ? (
          <div className="text-center">
            <h1 className="text-xl font-semibold">Проверьте почту</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Мы отправили ссылку для входа на <b>{state.sentTo}</b>. Откройте её в этом же браузере.
            </p>
          </div>
        ) : (
          <form action={action}>
            <h1 className="text-xl font-semibold">Вход в Folio</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Без пароля: пришлём ссылку на почту. Аккаунт создастся автоматически.
            </p>
            <label className="label mt-6" htmlFor="email">
              Почта
            </label>
            <input id="email" name="email" type="email" required autoFocus className="input" placeholder="you@university.ru" />
            {captchaSiteKey && <Captcha siteKey={captchaSiteKey} nonce={nonce} resetKey={state} />}
            {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
            <div className="mt-4 [&>button]:w-full">
              <SubmitButton pendingText="Отправляем…">Получить ссылку</SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
