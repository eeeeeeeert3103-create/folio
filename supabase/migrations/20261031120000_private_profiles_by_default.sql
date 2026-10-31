-- New profiles require an explicit publication choice.
-- Existing profiles retain their current is_public value.
alter table public.profiles
  alter column is_public set default false;
