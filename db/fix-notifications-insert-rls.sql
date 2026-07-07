-- Fix friend-request notifications blocked by RLS on user_notifications.
-- Run in Supabase SQL editor if adding a friend fails with:
-- "new row violates row-level security policy for table user_notifications"

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
