"use client";

import { useActionState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { SubmitButton } from "@/components/submit-button";
import { LINK_LABELS, type Links, type Profile } from "@/lib/types";
import { saveProfile, type ActionState } from "./actions";

const LINK_PLACEHOLDERS: Record<keyof Links, string> = {
  github: "github.com/username",
  linkedin: "linkedin.com/in/username",
  telegram: "@username",
  behance: "behance.net/username",
  website: "mysite.ru",
};

export function ProfileForm({ profile, avatarUrl }: { profile: Profile; avatarUrl: string | null }) {
  const [state, action] = useActionState<ActionState, FormData>(saveProfile, {});

  return (
    <form action={action} className="card space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Профиль</h2>
        <p className="text-sm text-neutral-500">То, что работодатель увидит первым.</p>
      </div>

      <ImageUpload name="avatar_path" defaultPath={profile.avatar_path} defaultUrl={avatarUrl} shape="circle" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="full_name" label="Имя и фамилия" defaultValue={profile.full_name} required />
        <div>
          <label className="label" htmlFor="username">Адрес страницы</label>
          <div className="flex items-center rounded-lg border border-neutral-200 focus-within:border-neutral-900">
            <span className="pl-3 text-sm text-neutral-400">folio/</span>
            <input id="username" name="username" defaultValue={profile.username} required className="w-full bg-transparent px-1 py-2 text-sm outline-none" />
          </div>
        </div>
        <Field
          name="headline"
          label="Кто вы"
          defaultValue={profile.headline}
          placeholder="Frontend-разработчик, ищу стажировку"
          className="sm:col-span-2"
        />
        <Field name="university" label="Вуз" defaultValue={profile.university} placeholder="НИУ ВШЭ" />
        <Field name="degree" label="Направление" defaultValue={profile.degree} placeholder="Программная инженерия" />
        <Field name="graduation_year" label="Год выпуска" type="number" defaultValue={profile.graduation_year?.toString() ?? ""} placeholder="2027" />
        <Field name="location" label="Город" defaultValue={profile.location} placeholder="Москва" />
      </div>

      <div>
        <label className="label" htmlFor="bio">О себе</label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio}
          className="input"
          placeholder="Пара предложений: что умеете, что вам интересно и какую работу ищете."
        />
      </div>

      <div>
        <Field name="skills" label="Навыки" defaultValue={profile.skills.join(", ")} placeholder="React, TypeScript, Figma, SQL" />
        <p className="hint">Через запятую.</p>
      </div>

      <div>
        <h3 className="mb-3 font-medium">Контакты и ссылки</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="contact_email" label="Почта для связи" type="email" defaultValue={profile.contact_email} />
          {(Object.keys(LINK_LABELS) as (keyof Links)[]).map((key) => (
            <Field
              key={key}
              name={key}
              label={LINK_LABELS[key]}
              defaultValue={profile.links[key] ?? ""}
              placeholder={LINK_PLACEHOLDERS[key]}
            />
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="is_public" defaultChecked={profile.is_public} className="size-4 accent-neutral-900" />
        Страница видна всем, у кого есть ссылка
      </label>

      <div className="flex items-center gap-4 border-t border-neutral-100 pt-6">
        <SubmitButton>Сохранить профиль</SubmitButton>
        {state.ok && <span className="text-sm text-green-700">Сохранено ✓</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string };

export function Field({ name, label, className, ...rest }: FieldProps) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" {...rest} />
    </div>
  );
}
