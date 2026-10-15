import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { LINK_LABELS, type Links, type Profile, type Project } from "@/lib/types";
import { ShareBar } from "./share-bar";

type Props = { params: Promise<{ username: string }> };

const getProfile = cache(async (username: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle<Profile>();
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  if (!profile) return { title: "Не найдено" };
  return {
    title: profile.full_name || profile.username,
    description: profile.headline || profile.bio.slice(0, 160),
    openGraph: { images: profile.avatar_url ? [profile.avatar_url] : [] },
  };
}

export default async function PortfolioPage({ params }: Props) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();

  const supabase = await createClient();
  const [{ data: projects }, { data: auth }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", profile.id)
      .order("sort_order")
      .order("created_at")
      .returns<Project[]>(),
    supabase.auth.getUser(),
  ]);
  const isOwner = auth.user?.id === profile.id;

  const education = [profile.university, profile.degree, profile.graduation_year && `выпуск ${profile.graduation_year}`]
    .filter(Boolean)
    .join(" · ");
  const links = Object.entries(profile.links).filter(([, url]) => url) as [keyof Links, string][];

  return (
    <div className="min-h-screen bg-neutral-50 print:bg-white">
      <ShareBar isOwner={isOwner} isPublic={profile.is_public} />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 print:max-w-none print:p-0">
        {/* ─── Шапка ─── */}
        <section className="card print:border-0 print:p-0">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name} className="size-24 rounded-full object-cover" />
            ) : (
              <div className="grid size-24 place-items-center rounded-full bg-neutral-900 text-3xl font-semibold text-white">
                {(profile.full_name || profile.username).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{profile.full_name || profile.username}</h1>
              {profile.headline && <p className="mt-1 text-lg text-neutral-600">{profile.headline}</p>}
              <p className="mt-2 text-sm text-neutral-500">
                {[education, profile.location].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {profile.bio && <p className="mt-6 whitespace-pre-line leading-relaxed text-neutral-700">{profile.bio}</p>}

          {(profile.contact_email || links.length > 0) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {profile.contact_email && (
                <a href={`mailto:${profile.contact_email}`} className="btn-primary">
                  Написать
                </a>
              )}
              {links.map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="btn">
                  {LINK_LABELS[key]}
                </a>
              ))}
            </div>
          )}
          {/* В PDF кнопки бесполезны — печатаем адреса текстом */}
          <p className="hidden text-sm print:mt-3 print:block">
            {[profile.contact_email, ...links.map(([, url]) => url.replace(/^https?:\/\//, ""))]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        </section>

        {/* ─── Навыки ─── */}
        {profile.skills.length > 0 && (
          <section className="mt-6 print:mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Навыки</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ─── Проекты ─── */}
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Проекты</h2>
          {projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              {isOwner ? (
                <>
                  Проектов пока нет. <Link href="/dashboard" className="underline">Добавить</Link>
                </>
              ) : (
                "Скоро здесь появятся проекты."
              )}
            </p>
          )}
        </section>

        <p className="mt-16 text-center text-xs text-neutral-400 print:hidden">
          Сделано на <Link href="/" className="underline">Folio</Link>
        </p>
      </main>
    </div>
  );
}

function ProjectCard({ project: p }: { project: Project }) {
  return (
    <article className="card overflow-hidden p-0 print:break-inside-avoid print:border-neutral-300">
      {p.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image_url} alt={p.title} className="aspect-[16/9] w-full object-cover print:max-h-64" />
      )}
      <div className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-xl font-semibold">{p.title}</h3>
          {p.period && <span className="text-sm text-neutral-500">{p.period}</span>}
        </div>
        {p.role && <p className="mt-1 text-sm text-neutral-500">Роль: {p.role}</p>}
        {p.summary && <p className="mt-3 font-medium text-neutral-800">{p.summary}</p>}
        {p.description && <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-700">{p.description}</p>}
        {p.tech.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {p.tech.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
        )}
        {(p.url || p.repo_url) && (
          <div className="mt-5 flex gap-4 text-sm font-medium">
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                Демо ↗
              </a>
            )}
            {p.repo_url && (
              <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                Код ↗
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
