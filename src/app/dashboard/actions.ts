"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Links } from "@/lib/types";

export type ActionState = { error?: string; ok?: boolean };

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{2,29}$/;
// Адреса, которые заняты страницами самого сайта.
const RESERVED = new Set([
  "login", "logout", "dashboard", "auth", "api", "admin", "settings",
  "about", "help", "pricing", "blog", "jobs", "employers", "folio",
]);

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();

const list = (v: FormDataEntryValue | null) =>
  [...new Set(text(v).split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 40);

function link(v: FormDataEntryValue | null): string | undefined {
  const s = text(v);
  if (!s) return undefined;
  if (/^@[\w.]+$/.test(s)) return `https://t.me/${s.slice(1)}`;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

// Картинки принимаем только из своей папки в нашем хранилище —
// иначе на странице можно было бы показать что угодно с чужого сервера.
function ownImage(v: FormDataEntryValue | null, userId: string): string | null {
  const s = text(v);
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${userId}/`;
  return s.startsWith(prefix) && !s.includes("..") ? s : null;
}

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function usernameError(username: string): string | null {
  if (!USERNAME_RE.test(username))
    return "Адрес: 3–30 символов, латиница, цифры и дефис, начинается с буквы или цифры.";
  if (RESERVED.has(username)) return "Этот адрес зарезервирован, выберите другой.";
  return null;
}

// Понятные сообщения вместо технических ошибок базы.
function dbError(message: string): string {
  if (message.includes("Максимум 50")) return "Можно добавить не больше 50 проектов.";
  if (message.includes("_lengths")) return "Какое-то поле слишком длинное — сократите текст.";
  if (message.includes("_url") || message.includes("_links")) return "Проверьте ссылки: они должны начинаться с http:// или https://.";
  if (message.includes("_reserved")) return "Этот адрес зарезервирован, выберите другой.";
  return "Не получилось сохранить. Попробуйте ещё раз.";
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const username = text(fd.get("username")).toLowerCase();
  const err = usernameError(username);
  if (err) return { error: err };

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    full_name: text(fd.get("full_name")).slice(0, 100),
  });
  if (error) return { error: error.code === "23505" ? "Этот адрес уже занят." : error.message };

  redirect("/dashboard");
}

export async function saveProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const username = text(fd.get("username")).toLowerCase();
  const err = usernameError(username);
  if (err) return { error: err };

  const links: Links = {
    github: link(fd.get("github")),
    linkedin: link(fd.get("linkedin")),
    telegram: link(fd.get("telegram")),
    behance: link(fd.get("behance")),
    website: link(fd.get("website")),
  };
  const year = parseInt(text(fd.get("graduation_year")), 10);
  const email = text(fd.get("contact_email"));
  if (email && !EMAIL_RE.test(email)) return { error: "Проверьте почту для связи." };

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: text(fd.get("full_name")),
      headline: text(fd.get("headline")),
      university: text(fd.get("university")),
      degree: text(fd.get("degree")),
      graduation_year: year >= 1950 && year <= 2100 ? year : null,
      location: text(fd.get("location")),
      bio: text(fd.get("bio")),
      avatar_url: ownImage(fd.get("avatar_url"), user.id),
      skills: list(fd.get("skills")),
      links: JSON.parse(JSON.stringify(links)), // убирает пустые ссылки
      contact_email: email,
      is_public: fd.get("is_public") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { error: error.code === "23505" ? "Этот адрес уже занят." : dbError(error.message) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveProject(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const title = text(fd.get("title"));
  if (!title) return { error: "Укажите название проекта." };

  const row = {
    title,
    summary: text(fd.get("summary")),
    description: text(fd.get("description")),
    role: text(fd.get("role")),
    period: text(fd.get("period")),
    tech: list(fd.get("tech")),
    url: link(fd.get("url")) ?? null,
    repo_url: link(fd.get("repo_url")) ?? null,
    image_url: ownImage(fd.get("image_url"), user.id),
  };

  const id = text(fd.get("id"));
  let error;
  if (id) {
    ({ error } = await supabase.from("projects").update(row).eq("id", id).eq("user_id", user.id));
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
  if (error) return { error: dbError(error.message) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProject(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/", "layout");
}

export async function moveProject(id: string, direction: "up" | "down") {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("projects")
    .select("id, sort_order")
    .eq("user_id", user.id)
    .order("sort_order")
    .order("created_at");
  if (!data) return;

  const i = data.findIndex((p) => p.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= data.length) return;

  [data[i], data[j]] = [data[j], data[i]];
  await Promise.all(
    data.map((p, index) => supabase.from("projects").update({ sort_order: index }).eq("id", p.id)),
  );
  revalidatePath("/", "layout");
}
