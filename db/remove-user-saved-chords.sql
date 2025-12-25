-- Remove user_saved_chords table and related objects

-- Drop RLS policies first
drop policy if exists "User saved chords are viewable by owner" on public.user_saved_chords;
drop policy if exists "User saved chords are insertable by owner" on public.user_saved_chords;
drop policy if exists "User saved chords are deletable by owner" on public.user_saved_chords;

-- Drop indexes
drop index if exists idx_user_saved_chords_user_id;
drop index if exists idx_user_saved_chords_chord_id;

-- Drop the table
drop table if exists public.user_saved_chords;

