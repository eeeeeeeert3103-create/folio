"use client";

import { useActionState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { SubmitButton } from "@/components/submit-button";
import { SuggestInput } from "@/components/suggest-input";
import { CITIES, DEGREES, HEADLINES, SKILLS, UNIVERSITIES } from "@/lib/suggestions";
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
        <SuggestField
          name="headline"
          label="Кто вы"
          options={HEADLINES}
          defaultValue={profile.headline}
          placeholder="Frontend-разработчик, ищу стажировку"
          className="sm:col-span-2"
        />
        <SuggestField name="university" label="Вуз" options={UNIVERSITIES} defaultValue={profile.university} placeholder="НИУ ВШЭ" />
        <SuggestField name="degree" label="Направление" options={DEGREES} defaultValue={profile.degree} placeholder="Программная инженерия" />
        <Field name="graduation_year" label="Год выпуска" type="number" defaultValue={profile.graduation_year?.toString() ?? ""} placeholder="2027" />
        <SuggestField name="location" label="Город" options={CITIES} defaultValue={profile.location} placeholder="Москва" />
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
        <SuggestField
          name="skills"
          label="Навыки"
          options={SKILLS}
          multiple
          defaultValue={profile.skills.length ? profile.skills.join(", ") + ", " : ""}
          placeholder="React, TypeScript, Figma, SQL"
        />
        <p className="hint">Начните печатать — появятся подсказки. Несколько навыков — через запятую.</p>
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

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <label className="flex items-start gap-3 text-sm font-medium">
          <input type="checkbox" name="is_public" defaultChecked={profile.is_public} className="size-4 accent-neutral-900" />
          <span>Опубликовать страницу в интернете</span>
        </label>
        <p className="ml-7 mt-2 text-sm text-neutral-600">
          При публикации всем будут доступны имя, образование, город, описание, навыки, проекты, загруженные изображения,
          почта для связи и добавленные ссылки. Страницу могут переслать или скопировать; она также может появиться
          в поисковике. Скрытие страницы не отзывает уже созданные временные ссылки на изображения мгновенно.
        </p>
      </div>

      <div className="flex items-center gap-4 border-t border-neutral-100 pt-6">
        <SubmitButton>Сохранить профиль</SubmitButton>
        {state.ok && <span className="text-sm text-green-700">Сохранено ✓</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string };

type SuggestFieldProps = React.ComponentProps<typeof SuggestInput> & { label: string };

// Поле с подписью и подсказками при вводе.
export function SuggestField({ name, label, className, ...rest }: SuggestFieldProps) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <SuggestInput id={name} name={name} {...rest} />
    </div>
  );
}

export function Field({ name, label, className, ...rest }: FieldProps) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" {...rest} />
    </div>
  );
}
