-- Усиление защиты по итогам аудита.
-- Данные можно менять в обход сайта, напрямую через API Supabase,
-- поэтому все ограничения дублируются на уровне базы.

-- ─── Проверка ссылок: только http(s), без javascript:, data: и т. п. ───
create or replace function public.is_http_url(url text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select url is null or (url ~* '^https?://[^\s<>"]+$' and length(url) <= 500)
$$;

create or replace function public.are_http_urls(links jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(links) = 'object'
    and not exists (
      select 1 from jsonb_each(links) as e(key, value)
      where e.key not in ('github', 'linkedin', 'telegram', 'behance', 'website')
         or jsonb_typeof(e.value) <> 'string'
         or not public.is_http_url(e.value #>> '{}')
    )
$$;

-- ─── Профили: длины полей, формат почты и ссылок, зарезервированные адреса ───
alter table public.profiles
  add constraint profiles_username_reserved check (username not in (
    'login', 'logout', 'dashboard', 'auth', 'api', 'admin', 'settings',
    'about', 'help', 'pricing', 'blog', 'jobs', 'employers', 'folio'
  )),
  add constraint profiles_lengths check (
    length(full_name) <= 100 and length(headline) <= 150 and length(university) <= 150
    and length(degree) <= 150 and length(location) <= 100 and length(bio) <= 2000
    and cardinality(skills) <= 40 and length(array_to_string(skills, ',')) <= 1000
  ),
  add constraint profiles_graduation_year check (graduation_year between 1950 and 2100),
  add constraint profiles_contact_email check (
    contact_email = '' or (contact_email ~ '^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$' and length(contact_email) <= 200)
  ),
  add constraint profiles_avatar_url check (public.is_http_url(avatar_url)),
  add constraint profiles_links check (public.are_http_urls(links));

-- ─── Проекты ───
alter table public.projects
  add constraint projects_lengths check (
    length(title) between 1 and 120 and length(summary) <= 200 and length(description) <= 5000
    and length(role) <= 100 and length(period) <= 50
    and cardinality(tech) <= 30 and length(array_to_string(tech, ',')) <= 600
  ),
  add constraint projects_urls check (
    public.is_http_url(url) and public.is_http_url(repo_url) and public.is_http_url(image_url)
  );

-- Не больше 50 проектов на человека — защита от спама.
create or replace function public.limit_projects()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.projects where user_id = new.user_id) >= 50 then
    raise exception 'Максимум 50 проектов';
  end if;
  return new;
end
$$;

create trigger projects_limit before insert on public.projects
  for each row execute function public.limit_projects();

-- ─── Политики доступа: (select auth.uid()) вычисляется один раз на запрос ───
drop policy "Публичные профили видны всем" on public.profiles;
drop policy "Студент создаёт свой профиль" on public.profiles;
drop policy "Студент редактирует свой профиль" on public.profiles;

create policy "Публичные профили видны всем" on public.profiles
  for select using (is_public or (select auth.uid()) = id);
create policy "Студент создаёт свой профиль" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Студент редактирует свой профиль" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy "Проекты публичных профилей видны всем" on public.projects;
drop policy "Студент управляет своими проектами" on public.projects;

-- Одна политика на чтение вместо двух пересекающихся.
create policy "Проекты видны владельцу и всем, если профиль публичный" on public.projects
  for select using (
    (select auth.uid()) = user_id
    or exists (select 1 from public.profiles p where p.id = projects.user_id and p.is_public)
  );
create policy "Студент добавляет свои проекты" on public.projects
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Студент меняет свои проекты" on public.projects
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Студент удаляет свои проекты" on public.projects
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Служебные поля (id, владелец, дата создания) менять нельзя:
-- разрешаем обновлять только перечисленные колонки.
revoke update on public.profiles from anon, authenticated;
grant update (username, full_name, headline, university, degree, graduation_year, location,
  bio, avatar_url, skills, links, contact_email, is_public, updated_at)
  on public.profiles to authenticated;

revoke update on public.projects from anon, authenticated;
grant update (title, summary, description, role, period, tech, url, repo_url, image_url, sort_order)
  on public.projects to authenticated;
