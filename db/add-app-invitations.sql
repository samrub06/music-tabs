-- =============================================
-- APP INVITATIONS & ONBOARDING
-- =============================================

alter table public.profiles
  add column if not exists onboarding_completed_at timestamp with time zone;

-- Treat existing users as already onboarded
update public.profiles
set onboarding_completed_at = created_at
where onboarding_completed_at is null;

create table if not exists public.app_invitations (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  invitee_email text,
  inviter_display_name text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  accepted_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  accepted_at timestamp with time zone
);

create index if not exists idx_app_invitations_inviter on public.app_invitations(inviter_id, created_at desc);
create index if not exists idx_app_invitations_code on public.app_invitations(code);

alter table public.app_invitations enable row level security;

drop policy if exists "invitations_select_own" on public.app_invitations;
create policy "invitations_select_own"
  on public.app_invitations for select
  using (auth.uid() = inviter_id or auth.uid() = accepted_by_user_id);

drop policy if exists "invitations_insert_own" on public.app_invitations;
create policy "invitations_insert_own"
  on public.app_invitations for insert
  with check (auth.uid() = inviter_id);

drop policy if exists "invitations_update_own" on public.app_invitations;
create policy "invitations_update_own"
  on public.app_invitations for update
  using (auth.uid() = inviter_id or auth.uid() = accepted_by_user_id);

-- Public preview via security definer function (no broad table exposure)
create or replace function public.get_invitation_preview(p_code text)
returns table (
  code text,
  inviter_name text,
  inviter_avatar_url text,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    i.code,
    i.inviter_display_name,
    p.avatar_url,
    i.status
  from public.app_invitations i
  join public.profiles p on p.id = i.inviter_id
  where i.code = p_code
  limit 1;
$$;

grant execute on function public.get_invitation_preview(text) to anon, authenticated;

-- Allow friend_accepted in notifications if not already present
alter table public.user_notifications drop constraint if exists user_notifications_type_check;
alter table public.user_notifications add constraint user_notifications_type_check
  check (type in ('friend_request', 'friend_accepted', 'song_shared', 'playlist_shared', 'invitation_accepted'));
