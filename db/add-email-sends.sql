-- =============================================
-- EMAIL SENDS (Resend audit / campaign dedupe)
-- =============================================
-- Accessible only via service role (RLS on, no client policies).

create table if not exists public.email_sends (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  campaign text not null,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resend_id text,
  entity_type text,
  entity_id uuid
);

create index if not exists idx_email_sends_campaign_user_sent
  on public.email_sends (campaign, user_id, sent_at desc);

alter table public.email_sends enable row level security;
