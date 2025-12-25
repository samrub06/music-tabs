-- Chords schema

-- Create chords table
create table if not exists public.chords (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  chord_data jsonb not null,
  section text not null,
  tuning text[] default array['E', 'A', 'D', 'G', 'B', 'E'],
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create user_saved_chords table (junction table)
create table if not exists public.user_saved_chords (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  chord_id uuid references public.chords(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(user_id, chord_id)
);

-- Indexes for performance
create index if not exists idx_chords_name on public.chords(name);
create index if not exists idx_chords_section on public.chords(section);
create index if not exists idx_user_saved_chords_user_id on public.user_saved_chords(user_id);
create index if not exists idx_user_saved_chords_chord_id on public.user_saved_chords(chord_id);

-- Enable RLS
alter table public.chords enable row level security;
alter table public.user_saved_chords enable row level security;

-- Policies for chords: public read, admin write (for now, allow all authenticated users to read)
do $$ begin
  create policy "Chords are viewable by everyone" on public.chords
    for select using (true);
exception when duplicate_object then null; end $$;

-- Policies for user_saved_chords: owner-only read/write
do $$ begin
  create policy "User saved chords are viewable by owner" on public.user_saved_chords
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "User saved chords are insertable by owner" on public.user_saved_chords
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "User saved chords are deletable by owner" on public.user_saved_chords
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Trigger for updated_at on chords
create trigger handle_chords_updated_at
  before update on public.chords
  for each row execute procedure public.handle_updated_at();
