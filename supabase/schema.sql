-- ─── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  favorite_team text,
  xp           integer not null default 0,
  streak       integer not null default 0,
  updated_at   timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid() = id);

-- ─── Logged matches ───────────────────────────────────────────────────────────
create table public.logged_matches (
  id          text primary key,
  user_id     uuid references auth.users on delete cascade not null,
  home_team   text not null,
  away_team   text not null,
  competition text not null,
  date        timestamptz not null,
  home_score  integer,
  away_score  integer,
  rating      integer not null check (rating between 1 and 5),
  review      text,
  photo_url   text,
  logged_at   timestamptz not null default now()
);
alter table public.logged_matches enable row level security;
create policy "own matches" on public.logged_matches for all using (auth.uid() = user_id);

-- ─── User achievements ────────────────────────────────────────────────────────
create table public.user_achievements (
  user_id        uuid references auth.users on delete cascade not null,
  achievement_id text not null,
  unlocked       boolean not null default false,
  unlocked_at    timestamptz,
  primary key (user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
create policy "own achievements" on public.user_achievements for all using (auth.uid() = user_id);

-- ─── Weekly challenges ────────────────────────────────────────────────────────
create table public.weekly_challenges (
  user_id    uuid references auth.users on delete cascade primary key,
  current    integer not null default 0,
  completed  boolean not null default false,
  week_start date not null
);
alter table public.weekly_challenges enable row level security;
create policy "own challenge" on public.weekly_challenges for all using (auth.uid() = user_id);

-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
