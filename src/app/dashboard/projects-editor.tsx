"use client";

import { useActionState, useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { SubmitButton } from "@/components/submit-button";
import type { Project } from "@/lib/types";
import { deleteProject, moveProject, saveProject, type ActionState } from "./actions";
import { PROJECT_ROLES, SKILLS } from "@/lib/suggestions";
import { Field, SuggestField } from "./profile-form";

type Media = Record<string, string>;

export function ProjectsEditor({ projects, media }: { projects: Project[]; media: Media }) {
  // null — форма закрыта, "new" — новый проект, иначе id редактируемого.
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <section className="card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Проекты</h2>
          <p className="text-sm text-neutral-500">Учебные, пет-проекты, хакатоны, фриланс — всё считается.</p>
        </div>
        {editing === null && (
          <button className="btn-primary shrink-0" onClick={() => setEditing("new")}>
            + Добавить
          </button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {editing === "new" && <ProjectForm onDone={() => setEditing(null)} />}

        {projects.length === 0 && editing !== "new" && (
          <p className="rounded-xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-500">
            Пока пусто. Добавьте первый проект — даже курсовая подойдёт.
          </p>
        )}

        {projects.map((p, i) =>
          editing === p.id ? (
            <ProjectForm key={p.id} project={p} imageUrl={p.image_path ? media[p.image_path] : null} onDone={() => setEditing(null)} />
          ) : (
            <div key={p.id} className="flex items-center gap-4 rounded-xl border border-neutral-200 p-3">
              <div className="aspect-[16/9] w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {p.image_path && media[p.image_path] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media[p.image_path]} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="truncate text-sm text-neutral-500">{p.summary || p.tech.join(", ")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-sm">
                <IconButton label="Выше" disabled={i === 0} onClick={() => moveProject(p.id, "up")}>↑</IconButton>
                <IconButton label="Ниже" disabled={i === projects.length - 1} onClick={() => moveProject(p.id, "down")}>↓</IconButton>
                <button className="btn px-3 py-1.5" onClick={() => setEditing(p.id)} disabled={editing !== null}>
                  Изменить
                </button>
                <IconButton
                  label="Удалить"
                  onClick={() => confirm(`Удалить «${p.title}»?`) && deleteProject(p.id)}
                >
                  ✕
                </IconButton>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function IconButton({ label, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}

type FormProps = { project?: Project; imageUrl?: string | null; onDone: () => void };

function ProjectForm({ project, imageUrl, onDone }: FormProps) {
  const [state, action] = useActionState<ActionState, FormData>(saveProject, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-neutral-900 p-4">
      {project && <input type="hidden" name="id" value={project.id} />}
      <ImageUpload name="image_path" defaultPath={project?.image_path} defaultUrl={imageUrl} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Название" defaultValue={project?.title} required placeholder="Трекер привычек" />
        <SuggestField name="role" label="Ваша роль" options={PROJECT_ROLES} multiple defaultValue={project?.role} placeholder="Frontend, дизайн" />
        <Field
          name="summary"
          label="Коротко, одной строкой"
          defaultValue={project?.summary}
          placeholder="Веб-приложение для трекинга привычек с напоминаниями в Telegram"
          className="sm:col-span-2"
        />
      </div>

      <div>
        <label className="label" htmlFor="description">Подробнее</label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={project?.description}
          className="input"
          placeholder={"Задача: какую проблему решали.\nРешение: что сделали лично вы.\nРезультат: цифры, отзывы, оценка."}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SuggestField
          name="tech"
          label="Технологии"
          options={SKILLS}
          multiple
          defaultValue={project?.tech.length ? project.tech.join(", ") + ", " : ""}
          placeholder="Next.js, PostgreSQL"
        />
        <Field name="period" label="Когда" defaultValue={project?.period} placeholder="сен — дек 2025" />
        <Field name="url" label="Демо / ссылка" defaultValue={project?.url ?? ""} placeholder="myproject.ru" />
        <Field name="repo_url" label="Код" defaultValue={project?.repo_url ?? ""} placeholder="github.com/me/project" />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{project ? "Сохранить" : "Добавить проект"}</SubmitButton>
        <button type="button" className="btn" onClick={onDone}>Отмена</button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
