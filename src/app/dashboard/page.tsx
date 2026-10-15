import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Project } from "@/lib/types";
import { Onboarding } from "./onboarding";
import { ProfileForm } from "./profile-form";
import { ProjectsEditor } from "./projects-editor";
import { ShareCard } from "./share-card";

export const metadata: Metadata = { title: "Мой кабинет" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile) return <Onboarding suggestedUsername={user.email?.split("@")[0] ?? ""} />;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order")
    .order("created_at")
    .returns<Project[]>();

  // Адрес сайта берём из запроса: localhost при разработке, настоящий домен после публикации.
  const h = await headers();
  const siteUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <>
      <ShareCard siteUrl={siteUrl} username={profile.username} isPublic={profile.is_public} />
      <ProfileForm profile={profile} />
      <ProjectsEditor projects={projects ?? []} userId={user.id} />
    </>
  );
}
