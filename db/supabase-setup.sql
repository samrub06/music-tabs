-- =============================================
-- MUSIC TABS - SUPABASE DATABASE SETUP
-- =============================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create folders table
create table if not exists public.folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create songs table
create table if not exists public.songs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  author text,
  content text not null,
  folder_id uuid references public.folders(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.songs enable row level security;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- =============================================
-- FOLDERS POLICIES
-- =============================================

-- Users can view their own folders
create policy "Users can view own folders"
  on public.folders for select
  using (auth.uid() = user_id);

-- Users can create their own folders
create policy "Users can create own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

-- Users can update their own folders
create policy "Users can update own folders"
  on public.folders for update
  using (auth.uid() = user_id);

-- Users can delete their own folders
create policy "Users can delete own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

-- =============================================
-- SONGS POLICIES
-- =============================================

-- Users can view their own songs
create policy "Users can view own songs"
  on public.songs for select
  using (auth.uid() = user_id);

-- Users can create their own songs
create policy "Users can create own songs"
  on public.songs for insert
  with check (auth.uid() = user_id);

-- Users can update their own songs
create policy "Users can update own songs"
  on public.songs for update
  using (auth.uid() = user_id);

-- Users can delete their own songs
create policy "Users can delete own songs"
  on public.songs for delete
  using (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_folders_updated_at
  before update on public.folders
  for each row execute procedure public.handle_updated_at();

create trigger handle_songs_updated_at
  before update on public.songs
  for each row execute procedure public.handle_updated_at();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

create index if not exists idx_folders_user_id on public.folders(user_id);
create index if not exists idx_songs_user_id on public.songs(user_id);
create index if not exists idx_songs_folder_id on public.songs(folder_id);

