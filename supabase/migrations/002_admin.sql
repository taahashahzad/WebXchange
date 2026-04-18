-- ============================================================
-- 002_admin.sql  — moderation queue
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Add is_admin flag to profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 'pending' is now the default status for new website submissions
-- The check constraint in 001 already allows 'pending' and 'rejected'
-- but if your original migration used a different check, update it:
alter table public.websites
  drop constraint if exists websites_status_check;

alter table public.websites
  add constraint websites_status_check
  check (status in ('pending', 'active', 'paused', 'rejected'));

-- Default new submissions to pending (requires admin approval)
alter table public.websites
  alter column status set default 'pending';

-- RLS: admins can read ALL websites (including pending ones from any user)
create policy "Admins can read all websites"
  on public.websites for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- RLS: admins can update status on any website
create policy "Admins can update any website status"
  on public.websites for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Helper function: promote a user to admin
-- Usage: select make_admin('user@email.com');
create or replace function public.make_admin(user_email text)
returns void language plpgsql security definer as $$
begin
  update public.profiles p
  set is_admin = true
  from auth.users u
  where u.id = p.id and u.email = user_email;
end;
$$;