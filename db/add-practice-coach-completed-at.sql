-- Persist lyric-practice coach completion per user (cross-device)
alter table public.profiles
  add column if not exists practice_coach_completed_at timestamp with time zone;

comment on column public.profiles.practice_coach_completed_at is
  'When the user finished or skipped the lyric practice coach tutorial';
