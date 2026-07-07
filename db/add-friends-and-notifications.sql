-- =============================================
-- FRIENDS, NOTIFICATIONS & SHARING
-- =============================================

create table if not exists public.friendships (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);

create index if not exists idx_friendships_requester on public.friendships(requester_id, status);
create index if not exists idx_friendships_addressee on public.friendships(addressee_id, status);

create table if not exists public.user_notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('friend_request', 'friend_accepted', 'song_shared', 'playlist_shared')),
  entity_type text,
  entity_id uuid,
  title text not null,
  message text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_user_notifications_user_created
  on public.user_notifications(user_id, created_at desc);
create index if not exists idx_user_notifications_user_unread
  on public.user_notifications(user_id)
  where read_at is null;

create table if not exists public.shared_items (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  shared_with_id uuid references public.profiles(id) on delete cascade not null,
  entity_type text not null check (entity_type in ('song', 'playlist')),
  entity_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint shared_items_unique unique (owner_id, shared_with_id, entity_type, entity_id)
);

create index if not exists idx_shared_items_recipient
  on public.shared_items(shared_with_id, entity_type, entity_id);

alter table public.friendships enable row level security;
alter table public.user_notifications enable row level security;
alter table public.shared_items enable row level security;

-- Friendships: participants can read their rows
drop policy if exists "friendships_select_participants" on public.friendships;
create policy "friendships_select_participants"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friendships_insert_requester" on public.friendships;
create policy "friendships_insert_requester"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

drop policy if exists "friendships_update_participants" on public.friendships;
create policy "friendships_update_participants"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friendships_delete_participants" on public.friendships;
create policy "friendships_delete_participants"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Notifications: recipient only
drop policy if exists "notifications_select_own" on public.user_notifications;
create policy "notifications_select_own"
  on public.user_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.user_notifications;
create policy "notifications_update_own"
  on public.user_notifications for update
  using (auth.uid() = user_id);

drop policy if exists "notifications_insert_as_actor" on public.user_notifications;
create policy "notifications_insert_as_actor"
  on public.user_notifications for insert
  to authenticated
  with check (auth.uid() = actor_id and actor_id is not null);

create or replace function public.create_user_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text default null,
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns public.user_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification public.user_notifications;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_notifications (
    user_id,
    actor_id,
    type,
    title,
    message,
    entity_type,
    entity_id
  )
  values (
    p_user_id,
    auth.uid(),
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

grant execute on function public.create_user_notification(uuid, text, text, text, text, uuid) to authenticated;

-- Shared items
drop policy if exists "shared_items_select_participants" on public.shared_items;
create policy "shared_items_select_participants"
  on public.shared_items for select
  using (auth.uid() = owner_id or auth.uid() = shared_with_id);

drop policy if exists "shared_items_insert_owner" on public.shared_items;
create policy "shared_items_insert_owner"
  on public.shared_items for insert
  with check (auth.uid() = owner_id);

-- Allow authenticated users to search other profiles for friends
drop policy if exists "profiles_select_for_friend_search" on public.profiles;
create policy "profiles_select_for_friend_search"
  on public.profiles for select
  to authenticated
  using (auth.uid() is not null and id <> auth.uid());

-- Songs: allow access to items shared with the user
drop policy if exists "songs_select_shared_with_user" on public.songs;
create policy "songs_select_shared_with_user"
  on public.songs for select
  to authenticated
  using (
    exists (
      select 1
      from public.shared_items si
      where si.entity_type = 'song'
        and si.entity_id = songs.id
        and si.shared_with_id = auth.uid()
    )
  );

-- Playlists: allow access to items shared with the user
drop policy if exists "playlists_select_shared_with_user" on public.playlists;
create policy "playlists_select_shared_with_user"
  on public.playlists for select
  to authenticated
  using (
    exists (
      select 1
      from public.shared_items si
      where si.entity_type = 'playlist'
        and si.entity_id = playlists.id
        and si.shared_with_id = auth.uid()
    )
  );
