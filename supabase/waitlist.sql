-- ============================================================
-- Stride website · waitlist table
-- Run this ONCE in the Supabase SQL editor (same project as the app:
-- nqcydhogowrrzrarhcha). Lets the public site insert emails via the anon key,
-- without exposing the list (no public read).
-- ============================================================

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text,
  created_at timestamptz not null default now()
);

-- one row per email
create unique index if not exists waitlist_email_key on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

-- Anonymous visitors may INSERT only (basic shape check). They cannot read the
-- list. You read it from the Supabase dashboard / a service-role query.
drop policy if exists waitlist_insert on public.waitlist;
create policy waitlist_insert on public.waitlist
  for insert to anon, authenticated
  with check (
    char_length(email) between 3 and 320
    and position('@' in email) > 1
  );

revoke all on public.waitlist from anon, authenticated;
grant insert on public.waitlist to anon, authenticated;

-- Public signup COUNT for the live waitlist counter on the site. SECURITY
-- DEFINER so anonymous visitors can read the number without read access to the
-- rows themselves. The site displays BASELINE (2678) + this count.
create or replace function public.waitlist_count()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.waitlist;
$$;
grant execute on function public.waitlist_count() to anon, authenticated;

-- Export your list any time (dashboard SQL editor, service role):
--   select email, source, created_at from public.waitlist order by created_at desc;
