-- ============================================================
-- WebXchange — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────
-- Extends auth.users. Created automatically on signup via trigger.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  full_name     text,
  avatar_url    text,
  credits       integer not null default 500,   -- starter credits
  plan          text not null default 'free'    -- free | pro | enterprise
    check (plan in ('free','pro','enterprise')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── websites ─────────────────────────────────────────────────
create table if not exists public.websites (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  url             text not null,
  daily_cap       integer not null default 500,
  min_duration    integer not null default 30,  -- seconds
  device_target   text not null default 'all'
    check (device_target in ('all','desktop','mobile')),
  geo_target      text[],                        -- e.g. {'US','PK','GB'}
  status          text not null default 'active'
    check (status in ('active','paused','rejected')),
  quality_score   numeric(4,2) default 5.0,     -- 0–10
  visits_today    integer not null default 0,
  visits_total    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── surf_sessions ────────────────────────────────────────────
-- One row per "surf" — visitor views a site for the required duration.
create table if not exists public.surf_sessions (
  id              uuid primary key default uuid_generate_v4(),
  surfer_id       uuid not null references public.profiles(id) on delete cascade,
  website_id      uuid not null references public.websites(id) on delete cascade,
  credits_earned  integer not null default 0,
  duration_secs   integer,
  completed       boolean not null default false,
  skipped         boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ── credit_transactions ──────────────────────────────────────
-- Full ledger of every credit change.
create table if not exists public.credit_transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      integer not null,               -- positive = earn, negative = spend
  type        text not null
    check (type in ('surf_earn','traffic_spend','purchase','referral','bonus','refund')),
  description text,
  ref_id      uuid,                           -- optional link to session / website
  created_at  timestamptz not null default now()
);

-- ── traffic_logs ─────────────────────────────────────────────
-- A visit delivered to a website (debits credits from site owner).
create table if not exists public.traffic_logs (
  id           uuid primary key default uuid_generate_v4(),
  website_id   uuid not null references public.websites(id) on delete cascade,
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  surfer_id    uuid references public.profiles(id) on delete set null,
  session_id   uuid references public.surf_sessions(id) on delete set null,
  country      text,
  device       text,
  duration_secs integer,
  created_at   timestamptz not null default now()
);

-- ── leaderboard_view ────────────────────────────────────────
-- Materialised daily snapshot (refreshed by a scheduled function).
create or replace view public.leaderboard_today as
  select
    p.id,
    p.username,
    p.full_name,
    coalesce(sum(tl.duration_secs), 0)                          as total_duration,
    count(distinct tl.id)                                        as visits_delivered,
    coalesce(sum(ss.credits_earned) filter (
      where ss.created_at::date = current_date), 0)             as credits_earned_today
  from public.profiles p
  left join public.websites w  on w.user_id = p.id
  left join public.traffic_logs tl
         on tl.website_id = w.id
        and tl.created_at::date = current_date
  left join public.surf_sessions ss
         on ss.surfer_id = p.id
        and ss.created_at::date = current_date
  group by p.id
  order by visits_delivered desc;

-- ── daily_stats ──────────────────────────────────────────────
-- Aggregated per-user per-day analytics row (populated by edge function).
create table if not exists public.daily_stats (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  stat_date       date not null default current_date,
  visits_received integer not null default 0,
  credits_earned  integer not null default 0,
  credits_spent   integer not null default 0,
  avg_duration    numeric(6,2),
  unique (user_id, stat_date)
);

-- ── Helper: reset daily visit counters ───────────────────────
-- Call this from a Supabase scheduled Edge Function at midnight UTC.
create or replace function public.reset_daily_caps()
returns void language sql security definer as $$
  update public.websites set visits_today = 0;
$$;

-- ── Helper: complete a surf session (atomic) ─────────────────
create or replace function public.complete_surf_session(
  p_session_id   uuid,
  p_surfer_id    uuid,
  p_website_id   uuid,
  p_duration     integer,
  p_credits      integer
)
returns void language plpgsql security definer as $$
begin
  -- Mark session complete
  update public.surf_sessions
  set completed = true, duration_secs = p_duration, credits_earned = p_credits
  where id = p_session_id;

  -- Credit surfer
  update public.profiles
  set credits = credits + p_credits, updated_at = now()
  where id = p_surfer_id;

  -- Log transaction
  insert into public.credit_transactions
    (user_id, amount, type, description, ref_id)
  values
    (p_surfer_id, p_credits, 'surf_earn', 'Earned by surfing', p_session_id);

  -- Increment visit count on the website
  update public.websites
  set visits_today = visits_today + 1,
      visits_total = visits_total + 1,
      updated_at   = now()
  where id = p_website_id;

  -- Deduct credits from site owner
  update public.profiles p
  set credits = credits - p_credits, updated_at = now()
  from public.websites w
  where w.id = p_website_id and p.id = w.user_id;

  -- Log spend transaction for site owner
  insert into public.credit_transactions
    (user_id, amount, type, description, ref_id)
  select w.user_id, -p_credits, 'traffic_spend', 'Traffic delivered', p_session_id
  from public.websites w where w.id = p_website_id;
end;
$$;

-- ============================================================
-- Row-Level Security (RLS)
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.websites            enable row level security;
alter table public.surf_sessions       enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.traffic_logs        enable row level security;
alter table public.daily_stats         enable row level security;

-- profiles
create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- websites
create policy "Website owner full access"
  on public.websites for all using (auth.uid() = user_id);
create policy "Anyone can read active websites"
  on public.websites for select using (status = 'active');

-- surf_sessions
create policy "Surfer owns their sessions"
  on public.surf_sessions for all using (auth.uid() = surfer_id);

-- credit_transactions
create policy "User sees own transactions"
  on public.credit_transactions for select using (auth.uid() = user_id);

-- traffic_logs
create policy "Owner sees traffic to their sites"
  on public.traffic_logs for select
  using (auth.uid() = owner_id);
create policy "Surfer sees sessions they created"
  on public.traffic_logs for select
  using (auth.uid() = surfer_id);

-- daily_stats
create policy "User sees own daily stats"
  on public.daily_stats for select using (auth.uid() = user_id);

-- Leaderboard is public (view — no RLS needed)
grant select on public.leaderboard_today to anon, authenticated;
