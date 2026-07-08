-- Allow inviters to cancel their own pending invitations
drop policy if exists "invitations_delete_own" on public.app_invitations;
create policy "invitations_delete_own"
  on public.app_invitations for delete
  using (auth.uid() = inviter_id and status = 'pending');
