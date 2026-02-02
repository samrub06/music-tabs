-- =============================================
-- GAMIFICATION SYSTEM - DATABASE MIGRATION
-- =============================================

-- 1. Create user_stats table
create table if not exists public.user_stats (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  total_xp integer default 0 not null,
  current_level integer default 1 not null,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_activity_date date,
  total_songs_created integer default 0 not null,
  total_songs_viewed integer default 0 not null,
  total_folders_created integer default 0 not null,
  total_playlists_created integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create xp_transactions table
create table if not exists public.xp_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  xp_amount integer not null,
  action_type text not null,
  entity_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create user_badges table
create table if not exists public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_type text not null check (badge_type in ('milestone', 'achievement')),
  badge_key text not null,
  badge_name text not null,
  badge_description text,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_key)
);

-- 4. Create daily_song_views table
create table if not exists public.daily_song_views (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  song_id uuid references public.songs(id) on delete cascade not null,
  viewed_date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, song_id, viewed_date)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

create index if not exists idx_user_stats_total_xp on public.user_stats(total_xp desc);
create index if not exists idx_user_stats_user_id on public.user_stats(user_id);
create index if not exists idx_xp_transactions_user_id on public.xp_transactions(user_id, created_at desc);
create index if not exists idx_user_badges_user_id on public.user_badges(user_id);
create index if not exists idx_daily_song_views_user_song_date on public.daily_song_views(user_id, song_id, viewed_date);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.user_stats enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.user_badges enable row level security;
alter table public.daily_song_views enable row level security;

-- =============================================
-- USER_STATS POLICIES
-- =============================================

-- Users can view their own stats
create policy "Users can view own stats"
  on public.user_stats for select
  using (auth.uid() = user_id);

-- Users can view public stats for leaderboard (read-only)
create policy "Anyone can view stats for leaderboard"
  on public.user_stats for select
  using (true);

-- Users can update their own stats (via functions only)
create policy "Users can update own stats"
  on public.user_stats for update
  using (auth.uid() = user_id);

-- System can insert stats (via trigger)
create policy "System can insert stats"
  on public.user_stats for insert
  with check (true);

-- =============================================
-- XP_TRANSACTIONS POLICIES
-- =============================================

-- Users can view their own transactions
create policy "Users can view own transactions"
  on public.xp_transactions for select
  using (auth.uid() = user_id);

-- System can insert transactions (via functions)
create policy "System can insert transactions"
  on public.xp_transactions for insert
  with check (true);

-- =============================================
-- USER_BADGES POLICIES
-- =============================================

-- Users can view their own badges
create policy "Users can view own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

-- Anyone can view badges for leaderboard
create policy "Anyone can view badges for leaderboard"
  on public.user_badges for select
  using (true);

-- System can insert badges (via functions)
create policy "System can insert badges"
  on public.user_badges for insert
  with check (true);

-- =============================================
-- DAILY_SONG_VIEWS POLICIES
-- =============================================

-- Users can view their own views
create policy "Users can view own views"
  on public.daily_song_views for select
  using (auth.uid() = user_id);

-- System can insert views (via functions)
create policy "System can insert views"
  on public.daily_song_views for insert
  with check (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to calculate level from XP
-- Formula: XP needed for level N = 100 * (1.5^(N-1)) rounded
create or replace function public.calculate_level_from_xp(xp integer)
returns integer as $$
declare
  level integer := 1;
  xp_needed integer;
begin
  if xp < 100 then
    return 1;
  end if;
  
  loop
    level := level + 1;
    xp_needed := round(100 * power(1.5, level - 1));
    exit when xp < xp_needed;
  end loop;
  
  return level - 1;
end;
$$ language plpgsql immutable;

-- Function to calculate XP needed for a specific level
create or replace function public.calculate_xp_for_level(level integer)
returns integer as $$
begin
  if level <= 1 then
    return 0;
  end if;
  return round(100 * power(1.5, level - 1));
end;
$$ language plpgsql immutable;

-- Function to award XP and update stats
create or replace function public.award_xp(
  p_user_id uuid,
  p_xp_amount integer,
  p_action_type text,
  p_entity_id uuid default null
)
returns jsonb as $$
declare
  v_new_xp integer;
  v_old_level integer;
  v_new_level integer;
  v_level_up boolean := false;
  v_stats_record public.user_stats%rowtype;
begin
  -- Insert transaction
  insert into public.xp_transactions (user_id, xp_amount, action_type, entity_id)
  values (p_user_id, p_xp_amount, p_action_type, p_entity_id);
  
  -- Get or create user stats
  select * into v_stats_record
  from public.user_stats
  where user_id = p_user_id;
  
  if not found then
    -- Create initial stats
    insert into public.user_stats (user_id, total_xp, current_level)
    values (p_user_id, p_xp_amount, 1)
    returning * into v_stats_record;
  else
    -- Update stats
    v_new_xp := v_stats_record.total_xp + p_xp_amount;
    v_old_level := v_stats_record.current_level;
    v_new_level := public.calculate_level_from_xp(v_new_xp);
    
    if v_new_level > v_old_level then
      v_level_up := true;
    end if;
    
    update public.user_stats
    set 
      total_xp = v_new_xp,
      current_level = v_new_level,
      updated_at = now()
    where user_id = p_user_id
    returning * into v_stats_record;
  end if;
  
  -- Return result
  return jsonb_build_object(
    'total_xp', v_stats_record.total_xp,
    'current_level', v_stats_record.current_level,
    'level_up', v_level_up,
    'old_level', coalesce(v_old_level, 1),
    'new_level', v_stats_record.current_level
  );
end;
$$ language plpgsql security definer;

-- Function to update streak
create or replace function public.update_streak(p_user_id uuid)
returns jsonb as $$
declare
  v_stats_record public.user_stats%rowtype;
  v_today date := current_date;
  v_yesterday date := current_date - interval '1 day';
  v_streak_incremented boolean := false;
  v_daily_bonus_awarded boolean := false;
begin
  -- Get user stats
  select * into v_stats_record
  from public.user_stats
  where user_id = p_user_id;
  
  if not found then
    -- Create initial stats
    insert into public.user_stats (user_id, last_activity_date, current_streak)
    values (p_user_id, v_today, 1)
    returning * into v_stats_record;
    v_streak_incremented := true;
    v_daily_bonus_awarded := true;
  else
    -- Check if we need to update streak
    if v_stats_record.last_activity_date is null then
      -- First activity
      update public.user_stats
      set 
        last_activity_date = v_today,
        current_streak = 1,
        updated_at = now()
      where user_id = p_user_id
      returning * into v_stats_record;
      v_streak_incremented := true;
      v_daily_bonus_awarded := true;
    elsif v_stats_record.last_activity_date = v_today then
      -- Already active today, no change
      v_streak_incremented := false;
      v_daily_bonus_awarded := false;
    elsif v_stats_record.last_activity_date = v_yesterday then
      -- Consecutive day, increment streak
      declare
        v_new_streak integer := v_stats_record.current_streak + 1;
        v_new_longest_streak integer := greatest(v_stats_record.longest_streak, v_new_streak);
      begin
        update public.user_stats
        set 
          last_activity_date = v_today,
          current_streak = v_new_streak,
          longest_streak = v_new_longest_streak,
          updated_at = now()
        where user_id = p_user_id
        returning * into v_stats_record;
        v_streak_incremented := true;
        v_daily_bonus_awarded := true;
      end;
    else
      -- Streak broken, reset to 1
      update public.user_stats
      set 
        last_activity_date = v_today,
        current_streak = 1,
        updated_at = now()
      where user_id = p_user_id
      returning * into v_stats_record;
      v_streak_incremented := true;
      v_daily_bonus_awarded := true;
    end if;
  end if;
  
  -- Award daily login bonus if streak was maintained/incremented
  if v_daily_bonus_awarded then
    perform public.award_xp(p_user_id, 10, 'daily_login');
  end if;
  
  -- Return result
  return jsonb_build_object(
    'current_streak', v_stats_record.current_streak,
    'longest_streak', v_stats_record.longest_streak,
    'streak_incremented', v_streak_incremented,
    'daily_bonus_awarded', v_daily_bonus_awarded
  );
end;
$$ language plpgsql security definer;

-- Function to increment counters in user_stats
create or replace function public.increment_user_stat_counter(
  p_user_id uuid,
  p_counter_name text
)
returns void as $$
begin
  -- Get or create stats
  insert into public.user_stats (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
  
  -- Increment the appropriate counter
  case p_counter_name
    when 'total_songs_created' then
      update public.user_stats
      set total_songs_created = total_songs_created + 1,
          updated_at = now()
      where user_id = p_user_id;
    when 'total_songs_viewed' then
      update public.user_stats
      set total_songs_viewed = total_songs_viewed + 1,
          updated_at = now()
      where user_id = p_user_id;
    when 'total_folders_created' then
      update public.user_stats
      set total_folders_created = total_folders_created + 1,
          updated_at = now()
      where user_id = p_user_id;
    when 'total_playlists_created' then
      update public.user_stats
      set total_playlists_created = total_playlists_created + 1,
          updated_at = now()
      where user_id = p_user_id;
  end case;
end;
$$ language plpgsql security definer;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to initialize user_stats when profile is created
create or replace function public.handle_new_user_stats()
returns trigger as $$
begin
  insert into public.user_stats (user_id, total_xp, current_level, current_streak)
  values (new.id, 0, 1, 0);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and create new one
drop trigger if exists on_profile_created_stats on public.profiles;
create trigger on_profile_created_stats
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_stats();

-- Trigger to update updated_at for user_stats
create trigger handle_user_stats_updated_at
  before update on public.user_stats
  for each row execute procedure public.handle_updated_at();
