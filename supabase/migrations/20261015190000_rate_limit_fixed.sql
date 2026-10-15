-- Лимиты частоты задаются в самой базе, а не тем, кто вызывает функцию:
-- иначе пользователь мог бы вызвать её напрямую со своими лимитами.

alter table private.action_log add column id bigint generated always as identity primary key;

drop function public.check_rate_limit(text, int, int);

create or replace function public.check_rate_limit(p_action text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  max_count int;
  window_seconds int;
  recent int;
begin
  -- Таблица лимитов: действие → не больше max_count за window_seconds.
  select l.max_count, l.window_seconds into max_count, window_seconds
  from (values
    ('profile', 30, 60),
    ('project', 30, 60),
    ('upload',  20, 600)
  ) as l(action, max_count, window_seconds)
  where l.action = p_action;

  if uid is null or max_count is null then
    return false;
  end if;

  delete from private.action_log
    where user_id = uid and created_at < now() - interval '1 day';

  select count(*) into recent from private.action_log
    where user_id = uid and action = p_action
      and created_at > now() - make_interval(secs => window_seconds);

  if recent >= max_count then
    return false;
  end if;

  insert into private.action_log (user_id, action) values (uid, p_action);
  return true;
end
$$;

-- Вызывать могут только вошедшие пользователи — это и есть назначение функции.
revoke execute on function public.check_rate_limit(text) from public, anon;
grant execute on function public.check_rate_limit(text) to authenticated;
