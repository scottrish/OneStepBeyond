-- Supporter Invitation (docs/features/supporter-invitation-feature-spec-v0.1.md)
-- Implementation Note (2026-08-19): no real email is sent this
-- increment — the constructed invitation link is displayed to the
-- inviting Student directly. The token itself is still real: this
-- migration adds the columns that make it expiring, locked to the
-- invited email, and one-time-use, exactly as it will work once real
-- email delivery is built (see that spec's own Implementation Note).
-- SupportInvitation is not a separate table — its fields fold directly
-- into support_relationships (created by
-- 20260819040000_create_support_relationships_table.sql), per §27's
-- updated Recommended Data Model.

alter table public.support_relationships
  alter column supporter_id drop not null,
  add column invited_email text not null,
  add column token_hash text not null,
  add column expires_at timestamptz not null;

-- Token lookup is always by exact hash match, never enumerated — unique
-- so a hash collision can't silently resolve to the wrong invitation.
create unique index support_relationships_token_hash_idx
  on public.support_relationships(token_hash);

-- A Student creates a Pending invitation naming themselves. supporter_id
-- must be null at creation — the invited person may not have an account
-- yet (supporter-invitation-feature-spec-v0.1.md §10's New Account
-- Flow) — and is only ever set by the invited user's own Accept, via the
-- policy below, never by the inviting Student.
create policy "Students can create support invitations"
  on public.support_relationships for insert
  with check (
    auth.uid() = student_id
    and status = 'pending'
    and supporter_id is null
    and invited_by = 'student'
  );

-- "Locked to the invited user" is enforced here, not by trusting the
-- client: a Pending, unexpired invitation is visible only to a session
-- whose own authenticated email matches invited_email. A mismatched or
-- signed-out visitor gets no row back — not a 403 that would confirm the
-- invitation's existence to the wrong person.
create policy "Invited users can view invitations addressed to their email"
  on public.support_relationships for select
  using (
    status = 'pending'
    and expires_at > now()
    and invited_email = auth.jwt() ->> 'email'
  );

-- "One time use" is enforced by status leaving 'pending' permanently —
-- the same USING clause as the select policy above, so an already
-- accepted/declined/expired row can't be re-actioned. WITH CHECK
-- verifies the resulting row: the invited email can't change, the
-- outcome must be Active or Declined, Active must name the accepting
-- session as supporter_id, and Declined must leave supporter_id null (an
-- earlier draft of this policy let a decline set supporter_id to
-- anything, which would have let a stray relationship row become
-- visible, via the pre-existing "Supporters can view their own support
-- relationships" policy, to whichever id was written).
--
-- WITH CHECK alone is not the real boundary, though — a WITH CHECK
-- expression only constrains the columns it references; it has no way
-- to pin every *other* column (student_id, role, invited_by, token_hash,
-- expires_at, invited_at) back to its pre-update value. Caught in review
-- (schema-migration-reviewer): without a further restriction, an invited
-- user holding one legitimate Pending invitation could accept it while
-- simultaneously rewriting student_id to an unrelated victim in the same
-- request — satisfying this WITH CHECK entirely, and producing a fully
-- Active row that the Supporter-read policies on courses/assignments/
-- work_items/decomposition_attempts/reflections
-- (20260819040002_add_supporter_read_policies.sql) would then trust. The
-- column-level GRANT below is what actually closes that: Postgres
-- rejects any UPDATE naming a column outside the grant before RLS is
-- even evaluated, so student_id/role/invited_email/token_hash/
-- expires_at/invited_by/invited_at simply cannot appear in this policy's
-- UPDATE regardless of what WITH CHECK does or doesn't check.
create policy "Invited users can accept or decline their invitation"
  on public.support_relationships for update
  using (
    status = 'pending'
    and expires_at > now()
    and invited_email = auth.jwt() ->> 'email'
  )
  with check (
    invited_email = auth.jwt() ->> 'email'
    and (
      (status = 'active' and supporter_id = auth.uid())
      or (status = 'declined' and supporter_id is null)
    )
  );

grant insert on public.support_relationships to authenticated;
-- Column-level, not a blanket grant: the invited user's accept/decline
-- must never be able to touch student_id, role, invited_email,
-- token_hash, expires_at, invited_by, or invited_at — see the policy
-- comment above.
grant update (status, supporter_id, accepted_at) on public.support_relationships to authenticated;
