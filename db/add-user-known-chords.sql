-- Create user_known_chords table (junction table for manual known chords)
create table if not exists public.user_known_chords (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  chord_id uuid references public.chords(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(user_id, chord_id)
);

-- Indexes for performance
create index if not exists idx_user_known_chords_user_id on public.user_known_chords(user_id);
create index if not exists idx_user_known_chords_chord_id on public.user_known_chords(chord_id);

-- Enable RLS
alter table public.user_known_chords enable row level security;

-- Policies for user_known_chords: owner-only read/write
do $$ begin
  create policy "User known chords are viewable by owner" on public.user_known_chords
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "User known chords are insertable by owner" on public.user_known_chords
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "User known chords are deletable by owner" on public.user_known_chords
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

