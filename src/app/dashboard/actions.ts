"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  detectImageType,
  MEDIA_BUCKET,
  MEDIA_MAX_BYTES,
  MEDIA_PATH_RE,
  removeMedia,
  removeOrphanMedia,
  signMedia,
} from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean };
export type UploadResult = { error?: string; path?: string; url?: string };

// ─── Схемы проверки ввода ──────────────────────────────────────────

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{2,29}$/;
// Адреса, которые заняты страницами самого сайта (дублируется в базе).
const RESERVED = new Set([
  "login", "logout", "dashboard", "auth", "api", "admin", "settings",
  "about", "help", "pricing", "blog", "jobs", "employers", "folio",
]);

const text = (max: number) => z.string().trim().max(max, `Текст не длиннее ${max} символов.`).default("");

const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_RE, "Адрес: 3–30 символов, латиница, цифры и дефис, начинается с буквы или цифры.")
  .refine((u) => !RESERVED.has(u), "Этот адрес зарезервирован, выберите другой.");

// «Навыки через запятую» → массив без повторов.
const commaList = (maxItems: number) =>
  z
    .string()
    .max(1000, "Слишком длинный список.")
    .default("")
    .transform((s) => [...new Set(s.split(",").map((x) => x.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(60, "Каждый пункт — не длиннее 60 символов.")).max(maxItems, `Не больше ${maxItems} пунктов.`));

// Ссылка: «github.com/me» → https://github.com/me, «@me» → https://t.me/me. Пустая → null.
const link = z
  .string()
  .trim()
  .max(500, "Слишком длинная ссылка.")
  .default("")
  .transform((s) => {
    if (!s) return null;
    if (/^@[\w.]+$/.test(s)) return `https://t.me/${s.slice(1)}`;
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  })
  .pipe(z.url({ protocol: /^https?$/, error: "Проверьте ссылки — похоже, где-то опечатка." }).nullable());

// Картинка — только из своей папки в хранилище.
const mediaPath = (userId: string) =>
  z
    .string()
    .trim()
    .default("")
    .transform((s) => s || null)
    .refine((p) => p === null || (MEDIA_PATH_RE.test(p) && p.startsWith(`${userId}/`)), "Картинка не найдена, загрузите её заново.");

const onboardingSchema = z.object({
  username,
  full_name: text(100).pipe(z.string().min(1, "Укажите имя.")),
});

const profileSchema = (userId: string) =>
  z.object({
    username,
    full_name: text(100).pipe(z.string().min(1, "Укажите имя.")),
    headline: text(150),
    university: text(150),
    degree: text(150),
    location: text(100),
    bio: text(2000),
    graduation_year: z
      .string()
      .trim()
      .default("")
      .transform((s) => (s ? Number(s) : null))
      .pipe(z.number("Год выпуска — число.").int().min(1950).max(2100, "Проверьте год выпуска.").nullable()),
    skills: commaList(40),
    contact_email: z.union([z.literal(""), z.email("Проверьте почту для связи.").max(200)]).default(""),
    github: link,
    linkedin: link,
    telegram: link,
    behance: link,
    website: link,
    is_public: z.literal("on").optional().transform((v) => v === "on"),
    avatar_path: mediaPath(userId),
  });

const projectSchema = (userId: string) =>
  z.object({
    id: z.union([z.literal(""), z.uuid()]).default(""),
    title: text(120).pipe(z.string().min(1, "Укажите название проекта.")),
    summary: text(200),
    description: text(5000),
    role: text(100).transform((s) => s.replace(/[,\s]+$/, "")), // «Frontend, » → «Frontend»
    period: text(50),
    tech: commaList(30),
    url: link,
    repo_url: link,
    image_path: mediaPath(userId),
  });

const projectId = z.uuid();
const direction = z.enum(["up", "down"]);

// Разбирает FormData по схеме; при ошибке возвращает первое понятное сообщение.
function parse<T extends z.ZodType>(schema: T, fd: FormData): { data: z.output<T> } | { error: string } {
  const result = schema.safeParse(Object.fromEntries(fd));
  return result.success ? { data: result.data } : { error: result.error.issues[0]?.message ?? "Проверьте поля." };
}

// ─── Общие помощники ───────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// Ограничение частоты на пользователя. Сами лимиты заданы в базе (check_rate_limit).
async function allowed(supabase: SupabaseClient, action: "profile" | "project" | "upload") {
  const { data } = await supabase.rpc("check_rate_limit", { p_action: action });
  return data === true;
}

const TOO_FAST = "Слишком много действий подряд. Подождите минуту и попробуйте снова.";

// Понятные сообщения вместо технических ошибок базы. Сырой текст наружу не отдаём.
function dbError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Этот адрес уже занят.";
  if (error.message.includes("Максимум 50")) return "Можно добавить не больше 50 проектов.";
  if (error.message.includes("_reserved")) return "Этот адрес зарезервирован, выберите другой.";
  console.error("Ошибка базы:", error);
  return "Не получилось сохранить. Попробуйте ещё раз.";
}

// ─── Действия ──────────────────────────────────────────────────────

export async function createProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = parse(onboardingSchema, fd);
  if ("error" in parsed) return parsed;
  if (!(await allowed(supabase, "profile"))) return { error: TOO_FAST };

  const { error } = await supabase.from("profiles").insert({ id: user.id, ...parsed.data });
  if (error) return { error: dbError(error) };

  redirect("/dashboard");
}

export async function saveProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = parse(profileSchema(user.id), fd);
  if ("error" in parsed) return parsed;
  if (!(await allowed(supabase, "profile"))) return { error: TOO_FAST };

  const { github, linkedin, telegram, behance, website, ...fields } = parsed.data;
  const links = Object.fromEntries(
    Object.entries({ github, linkedin, telegram, behance, website }).filter(([, url]) => url),
  );

  const { data: before } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  const { error } = await supabase
    .from("profiles")
    .update({ ...fields, links, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: dbError(error) };

  // Старый аватар больше не нужен.
  if (before?.avatar_path && before.avatar_path !== fields.avatar_path) {
    await removeMedia(supabase, [before.avatar_path]);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveProject(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = parse(projectSchema(user.id), fd);
  if ("error" in parsed) return parsed;
  if (!(await allowed(supabase, "project"))) return { error: TOO_FAST };

  const { id, ...row } = parsed.data;
  let error;
  if (id) {
    const { data: before } = await supabase
      .from("projects")
      .select("image_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!before) return { error: "Проект не найден." };

    ({ error } = await supabase.from("projects").update(row).eq("id", id).eq("user_id", user.id));
    if (!error && before.image_path && before.image_path !== row.image_path) {
      await removeMedia(supabase, [before.image_path]);
    }
  } else {
    // Новый проект — в конец списка.
    const { data: last } = await supabase
      .from("projects")
      .select("sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await supabase
      .from("projects")
      .insert({ ...row, user_id: user.id, sort_order: (last?.sort_order ?? -1) + 1 }));
  }
  if (error) return { error: dbError(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProject(id: string) {
  const { supabase, user } = await requireUser();
  if (!projectId.safeParse(id).success) return;
  if (!(await allowed(supabase, "project"))) return;

  const { data: deleted } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("image_path")
    .maybeSingle();
  await removeMedia(supabase, [deleted?.image_path]);
  revalidatePath("/", "layout");
}

export async function moveProject(id: string, dir: "up" | "down") {
  const { supabase, user } = await requireUser();
  if (!projectId.safeParse(id).success || !direction.safeParse(dir).success) return;
  if (!(await allowed(supabase, "project"))) return;

  const { data } = await supabase
    .from("projects")
    .select("id, sort_order")
    .eq("user_id", user.id)
    .order("sort_order")
    .order("created_at");
  if (!data) return;

  const i = data.findIndex((p) => p.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= data.length) return;

  [data[i], data[j]] = [data[j], data[i]];
  await Promise.all(
    data.map((p, index) => supabase.from("projects").update({ sort_order: index }).eq("id", p.id)),
  );
  revalidatePath("/", "layout");
}

// Загрузка картинки идёт через сервер: браузер не обращается к Supabase напрямую.
export async function uploadImage(fd: FormData): Promise<UploadResult> {
  const { supabase, user } = await requireUser();
  if (!(await allowed(supabase, "upload"))) return { error: TOO_FAST };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Выберите файл." };
  if (file.size > MEDIA_MAX_BYTES) return { error: "Файл больше 5 МБ." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return { error: "Подходят только PNG, JPG, WEBP или GIF." };

  // Заодно убираем свои брошенные загрузки, чтобы они не занимали место и квоту.
  await removeOrphanMedia(supabase, user.id);

  const path = `${user.id}/${crypto.randomUUID()}.${type.ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, bytes, { contentType: type.mime });
  if (error) {
    // Квоту проверяет политика хранилища (см. миграцию upload_quota) — она отвечает отказом в доступе.
    if (/row-level security/i.test(error.message)) {
      return { error: "Достигнут лимит загрузок: не больше 100 картинок в сутки. Попробуйте завтра." };
    }
    console.error("Ошибка загрузки:", error);
    return { error: "Не получилось загрузить файл. Попробуйте ещё раз." };
  }

  const urls = await signMedia(supabase, [path]);
  return { path, url: urls[path] };
}
