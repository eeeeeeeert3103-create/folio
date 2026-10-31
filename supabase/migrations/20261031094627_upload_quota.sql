-- Квота на картинки: не больше 100 загрузок в сутки и 300 файлов в папке на человека.
-- Проверяет политика хранилища, поэтому лимит не обойти загрузкой напрямую через API Supabase.
-- Брошенные загрузки сайт удаляет сам при следующей загрузке (removeOrphanMedia).

create or replace function public.media_quota_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from storage.objects o
      where o.bucket_id = 'media'
        and o.name like (select auth.uid())::text || '/%'
        and o.created_at > now() - interval '1 day') < 100
    and
    (select count(*) from storage.objects o
      where o.bucket_id = 'media'
        and o.name like (select auth.uid())::text || '/%') < 300
$$;

revoke execute on function public.media_quota_ok() from public, anon;
grant execute on function public.media_quota_ok() to authenticated;

drop policy "Загрузка в свою папку" on storage.objects;
create policy "Загрузка в свою папку с квотой"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.media_quota_ok()
  );
