import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signMedia } from "@/lib/media";
import { getSiteUrl } from "@/lib/site-url";
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
  const media = await signMedia(supabase, [profile.avatar_path, ...(projects ?? []).map((p) => p.image_path)]);

  const siteUrl = getSiteUrl();

  return (
    <>
      <ShareCard siteUrl={siteUrl} username={profile.username} isPublic={profile.is_public} />
      <ProfileForm profile={profile} avatarUrl={profile.avatar_path ? media[profile.avatar_path] : null} />
      <ProjectsEditor projects={projects ?? []} media={media} />
    </>
  );
}
