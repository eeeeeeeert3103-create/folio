"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { createProfile, type ActionState } from "./actions";

export function Onboarding({ suggestedUsername }: { suggestedUsername: string }) {
  const [state, action] = useActionState<ActionState, FormData>(createProfile, {});
  const suggestion = suggestedUsername.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+/, "").slice(0, 30);

  return (
    <form action={action} className="card mx-auto max-w-md">
      <h1 className="text-xl font-semibold">Добро пожаловать в Folio 👋</h1>
      <p className="mt-1 text-sm text-neutral-600">Два поля — и можно наполнять портфолио.</p>

      <label className="label mt-6" htmlFor="full_name">Имя и фамилия</label>
      <input id="full_name" name="full_name" className="input" required placeholder="Иван Петров" />

      <label className="label mt-4" htmlFor="username">Адрес вашей страницы</label>
      <div className="flex items-center rounded-lg border border-neutral-200 focus-within:border-neutral-900">
        <span className="pl-3 text-sm text-neutral-400">folio/</span>
        <input id="username" name="username" defaultValue={suggestion} required className="w-full bg-transparent px-1 py-2 text-sm outline-none" placeholder="ivan-petrov" />
      </div>
      <p className="hint">Латиница, цифры и дефис. Потом можно поменять.</p>

      {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
      <div className="mt-6">
        <SubmitButton pendingText="Создаём…">Создать портфолио</SubmitButton>
      </div>
    </form>
  );
}
