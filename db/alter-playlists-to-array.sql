-- Migrate playlists to use an array of song IDs instead of playlist_items snapshots

-- 1) Add song_ids column to playlists
alter table if exists public.playlists
  add column if not exists song_ids uuid[] not null default '{}'::uuid[];

-- 2) Backfill from playlist_items if table exists
do $$
begin
  if exists (
    select from information_schema.tables 
    where table_schema = 'public' and table_name = 'playlist_items'
  ) then
    update public.playlists p
    set song_ids = coalesce(
      (
        select array_agg(it.original_song_id order by it.order_index)
        from public.playlist_items it
        where it.playlist_id = p.id and it.original_song_id is not null
      ),
      '{}'::uuid[]
    );
  end if;
end $$;

-- 3) Drop playlist_items table if present (no longer needed)
do $$ begin
  if exists (
    select from information_schema.tables 
    where table_schema = 'public' and table_name = 'playlist_items'
  ) then
    drop table public.playlist_items cascade;
  end if;
end $$;


