-- Приватное хранилище картинок и ограничение частоты действий.

-- ─── 1. В базе храним путь к файлу («<user_id>/<uuid>.png»), а не публичную ссылку ───
alter table public.profiles drop constraint profiles_avatar_url;
alter table public.projects drop constraint projects_urls;

alter table public.profiles rename column avatar_url to avatar_path;
alter table public.projects rename column image_url to image_path;

-- Переводим уже сохранённые публичные ссылки в пути.
update public.profiles
  set avatar_path = regexp_replace(avatar_path, '^.*/storage/v1/object/public/media/', '')
  where avatar_path like 'http%';
update public.projects
  set image_path = regexp_replace(image_path, '^.*/storage/v1/object/public/media/', '')
  where image_path like 'http%';

-- Путь только в своей папке и только в нашем формате имени.
alter table public.profiles add constraint profiles_avatar_path check (
  avatar_path is null
  or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(png|jpg|webp|gif)$')
);
alter table public.projects
  add constraint projects_urls check (public.is_http_url(url) and public.is_http_url(repo_url)),
  add constraint projects_image_path check (
    image_path is null
    or image_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(png|jpg|webp|gif)$')
  );

create index if not exists profiles_avatar_path_idx on public.profiles (avatar_path) where avatar_path is not null;
create index if not exists projects_image_path_idx on public.projects (image_path) where image_path is not null;

-- Колонки переименованы — обновляем права на изменение.
revoke update on public.profiles from anon, authenticated;
grant update (username, full_name, headline, university, degree, graduation_year, location,
  bio, avatar_path, skills, links, contact_email, is_public, updated_at)
  on public.profiles to authenticated;
revoke update on public.projects from anon, authenticated;
grant update (title, summary, description, role, period, tech, url, repo_url, image_path, sort_order)
  on public.projects to authenticated;

-- ─── 2. Бакет больше не публичный ───
update storage.buckets set public = false where id = 'media';

-- Читать файл можно, если он свой или показан на публичной странице.
-- Так ни картинки скрытых профилей, ни неиспользуемые файлы посторонним недоступны,
-- а листинг показывает только то, что и так видно на сайте.
create policy "Чтение своих и опубликованных картинок"
  on storage.objects for select
  using (
    bucket_id = 'media' and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.profiles p where p.is_public and p.avatar_path = name)
      or exists (
        select 1 from public.projects pr
        join public.profiles p on p.id = pr.user_id
        where p.is_public and pr.image_path = name
      )
    )
  );

-- ─── 3. Ограничение частоты действий ───
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.action_log (
  user_id    uuid not null,
  action     text not null,
  created_at timestamptz not null default now()
);
create index action_log_lookup_idx on private.action_log (user_id, action, created_at);

-- Записывает действие и возвращает false, если за окно времени их было слишком много.
create or replace function public.check_rate_limit(p_action text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  recent int;
begin
  if uid is null then
    return false;
  end if;

  delete from private.action_log
    where user_id = uid and created_at < now() - interval '1 day';

  select count(*) into recent from private.action_log
    where user_id = uid and action = p_action
      and created_at > now() - make_interval(secs => p_window_seconds);

  if recent >= p_max then
    return false;
  end if;

  insert into private.action_log (user_id, action) values (uid, p_action);
  return true;
end
$$;

revoke execute on function public.check_rate_limit(text, int, int) from public, anon;
grant execute on function public.check_rate_limit(text, int, int) to authenticated;
