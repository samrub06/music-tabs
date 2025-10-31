-- Playlists schema

-- Create playlists table
create table if not exists public.playlists (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create playlist_items table storing duplicated song content snapshot
create table if not exists public.playlist_items (
  id uuid not null default gen_random_uuid() primary key,
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  original_song_id uuid references public.songs(id) on delete set null,
  order_index integer not null,
  title text not null,
  author text,
  sections jsonb not null default '[]'::jsonb,
  key text,
  capo integer,
  first_chord text,
  last_chord text,
  song_image_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Indexes
create index if not exists idx_playlist_items_playlist_id on public.playlist_items(playlist_id);
create index if not exists idx_playlists_user_id on public.playlists(user_id);

-- Enable RLS
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;

-- Policies for playlists: owner-only read/write
do $$ begin
  create policy "Playlists are viewable by owner" on public.playlists
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Playlists are insertable by owner" on public.playlists
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Playlists are updatable by owner" on public.playlists
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Playlists are deletable by owner" on public.playlists
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Policies for playlist_items: owner-only via parent playlist
do $$ begin
  create policy "Playlist items selectable by owner" on public.playlist_items
    for select using (
      exists (
        select 1 from public.playlists p
        where p.id = playlist_id and p.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Playlist items insertable by owner" on public.playlist_items
    for insert with check (
      exists (
        select 1 from public.playlists p
        where p.id = playlist_id and p.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Playlist items updatable by owner" on public.playlist_items
    for update using (
      exists (
        select 1 from public.playlists p
        where p.id = playlist_id and p.user_id = auth.uid()
      )
    ) with check (
      exists (
        select 1 from public.playlists p
        where p.id = playlist_id and p.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Playlist items deletable by owner" on public.playlist_items
    for delete using (
      exists (
        select 1 from public.playlists p
        where p.id = playlist_id and p.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;


