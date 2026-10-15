export type Links = {
  github?: string;
  linkedin?: string;
  telegram?: string;
  behance?: string;
  website?: string;
};

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  headline: string;
  university: string;
  degree: string;
  graduation_year: number | null;
  location: string;
  bio: string;
  avatar_url: string | null;
  skills: string[];
  links: Links;
  contact_email: string;
  is_public: boolean;
};

export type Project = {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  description: string;
  role: string;
  period: string;
  tech: string[];
  url: string | null;
  repo_url: string | null;
  image_url: string | null;
  sort_order: number;
};

export const LINK_LABELS: Record<keyof Links, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  telegram: "Telegram",
  behance: "Behance",
  website: "Сайт",
};
