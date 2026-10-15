-- Folio: схема базы данных.
-- Выполните целиком в Supabase: SQL Editor → New query → вставить → Run.

-- ─── Профили студентов ─────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  username        text unique not null
                  check (username ~ '^[a-z0-9][a-z0-9-]{2,29}$'),
  full_name       text not null default '',
  headline        text not null default '',   -- «Frontend-разработчик», «UX-дизайнер»
  university      text not null default '',
  degree          text not null default '',   -- направление / специальность
  graduation_year int,
  location        text not null default '',
  bio             text not null default '',
  avatar_url      text,
  skills          text[] not null default '{}',
  links           jsonb not null default '{}'::jsonb, -- github, linkedin, telegram, behance, website
  contact_email   text not null default '',
  is_public       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Публичные профили видны всем"
  on public.profiles for select
  using (is_public or auth.uid() = id);

create policy "Студент создаёт свой профиль"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Студент редактирует свой профиль"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── Проекты в портфолио ───────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  summary     text not null default '',  -- одна строка для карточки
  description text not null default '',  -- задача → решение → результат
  role        text not null default '',
  period      text not null default '',  -- «сен 2025 — дек 2025»
  tech        text[] not null default '{}',
  url         text,
  repo_url    text,
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "Проекты публичных профилей видны всем"
  on public.projects for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = projects.user_id and p.is_public
    )
  );

create policy "Студент управляет своими проектами"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Хранилище картинок (аватары, обложки проектов) ────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Каждый загружает файлы только в свою папку: media/<user_id>/...
create policy "Загрузка в свою папку"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Изменение своих файлов"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Удаление своих файлов"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
