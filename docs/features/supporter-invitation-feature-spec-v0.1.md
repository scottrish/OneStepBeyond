# Executive Function Coach

## Supporter Invitation & Onboarding — Feature Specification

Version 0.1

**Status:** Partially implemented (2026-08-20), by direct product-owner
instruction. Built: §6/§7's Primary Flow (Student invites Parent /
Guardian, Coach, or Teacher — §3's 2026-08-19 update), §8's link-display
delivery (no real email — see the Implementation Note immediately below),
§9/§10's Existing/New Account accept flow, §11's read-only Pending/Active
list, and §16's security requirements exactly as specified (real
expiring, email-locked, one-time-use tokens). Verified live end-to-end:
invite created as Teacher → link displayed → signed up as the exact
invited email → invitation found and correctly gated by that email →
accepted → relationship Active in the database → dashboard auto-resolved
to the correct Student at Coach visibility via
`supporter-role-based-access-feature-spec-v0.1.md`'s already-built access
layer.

**Not built:** resend and cancel (§4's Scope lists both; deferred as a
smaller follow-up rather than blocking this increment — a Pending
invitation sent to the wrong address currently has no in-app undo), §12's
Remove Supporter and §13's Supporter Leaves Relationship, and all of §20
onward (the Secondary/adult-initiated flow, P2 by the spec's own
priority marking).

---

# 1. Purpose

Allow a Student to invite trusted adults to support them while preserving the Student as the primary owner of the planning experience.

The feature supports two flows:

1. **Primary — Student invites Supporter**
   - Student invites a Parent / Guardian or Coach
   - invited adult creates or connects an account
   - a Support Relationship becomes Active after acceptance

2. **Secondary — Parent / Coach initiates**
   - adult starts setup first
   - adult invites a Student
   - Student activates or connects their account
   - Student owns the student workspace
   - initiating adult becomes a Supporter

No granular permissions are required initially.

---

# Implementation Note (this increment)

**Update (2026-08-19) — direct product-owner instruction:** *"As this is
just for testing, there is no need to actually send an email. So when
the [Student] invites a [Supporter], simply display an appropriate
invitation link. The link should be constructed in the same way that it
will eventually be constructed — expiring, locked to the invited user (it
can't be used by anyone with a different email), one time use (once
used, it can't be reused)."*

This changes §8's delivery mechanism only — the invitation itself is
still real, still governed by §16's Security Requirements exactly as
written. Nothing about the token's construction is a placeholder;
"testing" refers only to skipping the transport (email), not to loosening
what the token guarantees:

- **Expiring:** an `expires_at` column, checked on every read/accept —
  identical in effect to §15.
- **Locked to the invited user:** the invitation names an `invited_email`
  (not yet an `auth.users` row — the invited person may not have an
  account at invite time, per §10's New Account Flow). Enforcement is at
  the RLS layer: a signed-in session can only see or act on a pending
  invitation whose `invited_email` matches that session's own
  authenticated email — not by trusting whatever the client claims.
- **One time use:** governed by `status` — once an invitation leaves
  `Pending` (Active, Declined, Expired, Cancelled), the same link stops
  granting anything. No separate "used" flag is needed; §3's existing
  status lifecycle already is that flag.

**Architectural consequence worth flagging explicitly:** a real link
needs something to open it. This app has no URL-based routing at all
today (`CLAUDE.md`: add React Router "only when a feature actually needs
it" — nothing has, yet). This is that moment, but narrowly: not a reason
to adopt a router library, since one screen doesn't need one. The
existing precedent is `Root.tsx`'s own hand-rolled
`window.location.pathname.startsWith('/dashboard')` check — the same
pattern extends to a third branch, `/invite`, for the accept screen. See
`docs/decisions/` for whichever record captures this when it's built.

`SupportInvitation` (§27's original suggested shape) is not a separate
table for this increment — its fields (`tokenHash`, `expiresAt`,
`invited_email`) are added directly to `support_relationships` (already
built by `supporter-role-based-access-feature-spec-v0.1.md`), which also
means that table's `supporter_id` becomes nullable (unknown until
acceptance) rather than required at row-creation time. §18's note that
"invitation and relationship lifecycle" can be simplified together is
being taken up, not deferred.

---

# 2. Product Principle

The Student owns the learning and planning experience.

Supporters participate through an explicit Support Relationship rather than owning the Student workspace.

```text
Student
  owns
    Assignments
    Work Breakdowns
    Plans
    Reflections

Student
  has
    Support Relationships
        ├── Parent / Guardian
        └── Coach
```

Who initiates onboarding is separate from who owns the student experience.

---

# 3. Domain Concepts

Use the existing Support Network concepts:

- Student
- Supporter
- Support Relationship

## Supporter

A trusted adult associated with a Student.

Initial roles:

- Parent / Guardian
- Executive Function Coach
- Teacher

**Update (2026-08-19):** Teacher is not a distinct role at this time —
direct product-owner instruction: *"teacher will not be any different
than coach. There is no need to distinguish teacher and coach."* Teacher
is stored as the exact same `role` value as Coach (see §27), not a
different value with identical behavior — there is nothing to keep in
sync because there is only one thing stored. "Teacher" exists only as a
second button on §7 Step 1's screen, for a Student who wouldn't otherwise
think to tap "Coach"; from that tap on, everything (invitation copy,
Active/Pending lists, dashboard access) treats it as an ordinary Coach
relationship. If Teacher ever needs to actually behave differently (e.g.
Domain-Model.md's separate, unspecified idea of a Teacher as an
authoritative source for Assignment Briefs, not just a Supporter), that
is new scope, not an extension of this one.

Possible later roles:

- Counselor
- Tutor

## Support Relationship

Represents the relationship between a Student and Supporter.

Suggested attributes:

```text
SupportRelationship
- studentId
- supporterId
- role
- status
- invitedBy
- invitedAt
- acceptedAt
- endedAt
```

Statuses:

```text
Pending
Active
Declined
Expired
Ended
```

`invitedBy`:

```text
Student
Supporter
```

---

# 4. Scope

## In Scope

- Student invites Parent / Guardian
- Student invites Coach
- invite by email
- invited adult creates or signs into account
- accept / decline
- Student sees Pending and Active Supporters
- resend Pending invitation
- cancel Pending invitation
- Student ends Active Support Relationship
- Supporter can leave relationship
- Parent / Coach initiated onboarding as second priority

## Out of Scope

- granular permissions
- custom permissions per Supporter
- school / organization accounts
- teacher rosters
- coach caseload management
- billing ownership
- legal guardianship verification
- Supporter editing the Student's Plan or Work Breakdown
- account impersonation

---

# 5. Initial Access Model

## Student

The Student:

- owns the student workspace
- manages Support Relationships
- sees who has access
- invites Supporters
- cancels Pending invitations
- ends Active relationships

## Parent / Guardian

Receives the Parent dashboard experience defined elsewhere.

## Coach

Receives the Coach dashboard experience defined elsewhere.

## Constraint

A Supporter does not become owner of:

- Assignments
- Work Breakdowns
- Plans
- Reflections

Any future adult-generated planning change remains a proposal unless the Student accepts or modifies it.

---

# 6. Primary Flow — Student Invites Supporter

Priority:

> **P1 — implement first**

Suggested entry point:

```text
Profile / Settings
    ↓
Support
    ↓
Add Supporter
```

Suggested title:

> **Add someone who supports you**

Choices:

- Parent / Guardian
- Coach
- Teacher

---

# 7. Student Invitation Flow

## Step 1 — Choose Supporter Type

Prompt:

> **Who would you like to add?**

Options:

- Parent / Guardian
- Coach
- Teacher

Choosing Teacher stores the exact same `role` as choosing Coach (§3's
2026-08-19 update) — not a different value that happens to behave the
same, a literally identical one. Nothing downstream (invitation copy,
Active/Pending lists in §11, dashboard access) distinguishes which of the
two was picked; both are simply labeled Coach from that point on. Teacher
exists only as a second button on this one screen, for a Student who
wouldn't otherwise think to tap "Coach."

## Step 2 — Enter Email

Prompt:

> **What's their email?**

Input:

- email address

## Step 3 — Explain Access

Keep this concise.

Parent example:

> They'll be able to see the Parent dashboard for your account.

Coach example:

> They'll be able to see the Coach dashboard for your account.

Also state:

> **You can remove them later.**

Do not show a permissions matrix.

## Step 4 — Send Invitation

Action:

> **Send invite**

Create a Pending invitation / Support Relationship.

Show:

- email
- role
- status: Pending

---

# 8. Invitation Delivery

**This increment (see Implementation Note above): no email is sent.**
Step 4 of §7, immediately after creating the Pending invitation, displays
the constructed link directly to the inviting Student — in a copyable
text field, not a "check your email" message — with a short explanation
that they should send it to the person themselves however they'd like
(text, in person, etc.). This is a transport substitution only; the
content and intent below is unchanged from what a real email would say,
because it's what the Student reads on this same screen instead:

Invitation should contain:

- product name
- inviting Student's display name
- requested Supporter role
- Accept action
- Decline action
- expiration information if applicable

Example intent:

> Alex invited you to support them as a Coach.

Avoid wording that suggests the adult is taking ownership of the account.

When real email delivery is eventually built, this screen's copyable
link becomes the email's own call-to-action link — same token, same
route, same accept flow. Nothing about the token or the `/invite` route
described below is specific to the no-email version.

---

# 9. Existing Account Flow

```text
Invitation link
    ↓
Sign in
    ↓
Review invitation
    ↓
Accept / Decline
```

On Accept:

- Support Relationship becomes Active
- record `acceptedAt`
- route to role-appropriate dashboard

On Decline:

- status becomes Declined

---

# 10. New Account Flow

```text
Invitation link
    ↓
Create account
    ↓
Verify email if required
    ↓
Review invitation
    ↓
Accept / Decline
```

The invitation must survive account creation.

The Student should not need to resend it.

---

# 11. Student Support Management

## Active Supporters

Example:

```text
Sarah Carter
Parent / Guardian
Active

Jordan Lee
Coach
Active
```

Action:

- Remove

## Pending Invitations

Example:

```text
coach@example.com
Coach
Invite pending
```

Actions:

- Resend
- Cancel

Keep the UI simple.

---

# 12. Removing a Supporter

Require confirmation.

Example:

> Remove Jordan as your Coach?

Explain:

> They will no longer be able to access your dashboard information.

On confirm:

- relationship becomes Ended
- record `endedAt`
- future access ends

Do not delete historical evidence.

---

# 13. Supporter Leaves Relationship

Supporter action:

> **Stop supporting this student**

Require confirmation.

On confirm:

- relationship becomes Ended
- Student disappears from the Supporter's active list
- Student can see that the Supporter is no longer connected

---

# 14. Duplicate Invitation Rules

Avoid duplicates for the same:

```text
Student + Supporter + Role
```

If already Active:

> They're already connected as your Coach.

If Pending:

> An invite is already waiting for this email.

Offer:

- Resend
- Cancel

---

# 15. Invitation Expiration

Recommended:

- invitations expire after a configurable period, such as 7–14 days

On expiration:

- status becomes Expired
- Student can resend

The domain should not depend on a specific number of days.

---

# 16. Security Requirements

Invitation tokens should:

- be cryptographically unguessable
- be single-purpose
- expire
- not expose Student IDs directly
- become unusable after Accept / Decline / Cancel / Expiration

The authenticated email must match the intended invitee, or the user must explicitly switch accounts.

**Concrete mechanism for this increment** (Implementation Note above):
the raw token is generated client-side (`crypto.randomUUID()` or
equivalent — Web Crypto is already available, no new dependency), and
only its hash (`token_hash`, e.g. SHA-256 via `crypto.subtle.digest`) is
stored — the raw token exists only in the constructed link, never
persisted. "Not expose Student IDs directly" and "authenticated email
must match" are both satisfied the same way: RLS on
`support_relationships` only reveals a Pending row to a session whose own
authenticated email equals that row's `invited_email` — a mismatched or
signed-out visitor gets nothing back, not a 403 that would confirm the
invitation's existence.

---

# 17. Privacy Requirements

- Student can always see who is connected.
- Student can remove a Supporter.
- Supporter access starts only after acceptance.
- Parent and Coach views are role-appropriate projections.
- Internal Coach-only model data does not automatically become Parent-visible.
- Ending a relationship ends future access.
- Historical audit records may remain internally.

This spec does not define legal consent requirements.

---

# 18. Domain Events

Recommended:

```text
Supporter Invited
Supporter Invitation Resent
Supporter Invitation Cancelled
Supporter Invitation Accepted
Supporter Invitation Declined
Supporter Invitation Expired
Support Relationship Activated
Support Relationship Ended
```

Simplify if invitation and relationship lifecycle are modeled together.

---

# 19. Primary Flow Acceptance Criteria

- Student can invite Parent / Guardian by email.
- Student can invite Coach by email.
- Existing user can sign in and accept.
- New Supporter can create an account and accept without a new invite.
- Acceptance creates an Active Support Relationship.
- Parent receives Parent dashboard access.
- Coach receives Coach dashboard access.
- Student sees Pending and Active Supporters.
- Student can cancel Pending invites.
- Student can end Active relationships.
- Adding a Supporter never transfers workspace ownership.

---

# 20. Secondary Flow — Parent / Coach Initiates

Priority:

> **P2 — implement after Student-initiated invitations**

Purpose:

Allow an adult who discovers the product first to invite the Student without making the adult the permanent owner of the student workspace.

---

# 21. Adult-Initiated Entry

Possible onboarding choices:

```text
I'm a student
I'm a parent / guardian
I'm a coach or teacher
```

For Parent / Coach:

- create or sign into adult account
- choose `Invite a student`

---

# 22. Adult Invites Student

## Step 1 — Student Email

Prompt:

> **What's the student's email?**

## Step 2 — Explain Ownership

Parent example:

> The student will own their planning account. Once they accept, you'll be connected as their Parent / Guardian.

Coach example (also used for Teacher — §3's 2026-08-19 update, same
role, same copy):

> The student will own their planning account. Once they accept, you'll be connected as their Coach.

## Step 3 — Send

Create Pending relationship with:

```text
invitedBy = Supporter
role = Parent / Guardian | Coach
```

---

# 23. Student Accepts Adult-Initiated Invitation

## Existing Student

```text
Invitation
    ↓
Sign in
    ↓
Review inviter
    ↓
Accept / Decline
```

On Accept:

- relationship becomes Active
- existing workspace remains Student-owned

## New Student

```text
Invitation
    ↓
Create Student account
    ↓
Complete minimum setup
    ↓
Review Supporter relationship
    ↓
Accept
```

After activation:

- Student owns workspace
- adult becomes Supporter
- adult gets role-appropriate dashboard access

---

# 24. Adult-Initiated Constraints

The adult must not:

- become owner of the Student workspace
- silently activate access before Student acceptance
- bypass the Student's ability to decline
- pre-create authoritative Work Breakdowns or Plans as part of onboarding

Any future legal consent requirements should be added explicitly rather than changing the ownership model implicitly.

---

# 25. Multiple Students per Supporter

Allow a Supporter to have relationships with multiple Students.

Important especially for Coaches.

```text
Coach
  ├── Student A
  ├── Student B
  └── Student C
```

Initial UI can use a simple Student selector.

---

# 26. Multiple Supporters per Student

Allow multiple Supporters.

```text
Student
  ├── Parent / Guardian A
  ├── Parent / Guardian B
  └── Coach
```

Do not model fixed fields such as:

```text
student.parentUserId
student.coachUserId
```

Use Support Relationships.

---

# 27. Recommended Data Model

**Superseded by what's actually built.** The `User`/`StudentProfile`/
`SupporterProfile` split below was this spec's original conceptual
sketch; it doesn't match this codebase's established convention (every
table references `auth.users(id)` directly — see e.g.
`20260815003757_create_courses_table.sql`'s own comment on why), and
`supporter-role-based-access-feature-spec-v0.1.md` already built
`support_relationships` on that flat convention instead. `SupportInvitation`
is likewise not a separate table (this section's original sketch) — its
fields fold directly into `support_relationships`, per the Implementation
Note at the top of this document:

```text
support_relationships                  -- already exists; this increment
- id                                    -- alters it, doesn't create it
- student_id          (references auth.users, not null)
- supporter_id         (references auth.users, NULLABLE — unknown until
                         the invited person actually accepts)
- invited_email        (new — who the invitation names; the RLS anchor
                         for "locked to the invited user")
- token_hash            (new — sha-256 of the raw token; raw token never
                         persisted)
- expires_at            (new)
- role
- status
- invited_by
- invited_at
- accepted_at
- ended_at
```

Original conceptual sketch, kept for historical context (superseded
above):

```text
User
- id
- email
- displayName

StudentProfile
- userId

SupporterProfile
- userId

SupportInvitation
- id
- relationshipId or student/supporter reference
- email
- tokenHash
- expiresAt
- sentAt
- acceptedAt
- cancelledAt
```

Avoid making Student and Supporter account types permanently mutually exclusive.

---

# 28. Role Resolution

After login, resolve available experiences from active relationships.

## Student Only

Route to Student app.

## Supporter Only

Route to Supporter Student selector or sole Student dashboard.

## Student + Supporter

Allow later workspace switching:

```text
My Student Workspace
Supporting Alex
Supporting Sam
```

No need to optimize this in the first implementation, but do not prevent it architecturally.

---

# 29. Notification Behavior

Email invitation delivery is required.

Recommended emails:

- initial invitation
- resend

Optional later:

- invitation accepted
- invitation about to expire

No in-app notification system is required for this feature.

---

# 30. UX Copy Principles

Use:

> Add someone who supports you

rather than:

> Manage account permissions

Use relational labels:

- Parent / Guardian
- Coach

Use:

- Remove
- Stop sharing with this person

rather than technical authorization language.

---

# 31. Diagnostic / Test Requirements

Diagnostic Mode should expose:

```text
Student
Supporter
SupportRelationship
role
status
invitedBy
invitedAt
acceptedAt
endedAt
```

Suggested fixtures:

```text
student-no-supporters
student-parent-pending
student-parent-active
student-coach-active
student-parent-and-coach
coach-multiple-students
adult-invited-student-pending
```

---

# 32. Playwright Scenarios

## A — Student Invites Parent

1. Student signs in.
2. Opens Support.
3. Chooses Parent / Guardian.
4. Enters email.
5. Sends invite.
6. Verify Pending relationship.
7. Parent accepts.
8. Verify Active relationship.
9. Parent can access Parent dashboard.

## B — Student Invites Coach

Same flow with role = Coach.

## C — Cancel Pending Invite

- Student cancels Pending invite.
- token no longer works.
- relationship never becomes Active.

## D — Remove Active Supporter

- Student removes Supporter.
- Supporter loses access.
- historical relationship remains Ended.

## E — Existing Account

- invited email already has account.
- sign-in + acceptance activates relationship.

## F — New Supporter Account

- invited email has no account.
- signup preserves invitation.
- acceptance activates relationship.

## G — Adult Initiates

1. Coach creates account.
2. Coach invites Student.
3. Student signs up / signs in.
4. Student accepts.
5. Student owns workspace.
6. Coach becomes Active Supporter.

---

# 33. Delivery Phasing

## Phase 1 — Student-Initiated Supporter Invitations

Implement first:

- Support screen
- Parent / Guardian invite
- Coach invite
- email invitation
- existing-user acceptance
- new-user signup + acceptance
- Pending / Active status
- resend
- cancel
- Student removes Supporter
- Supporter leaves relationship
- role-appropriate dashboard access

No granular permissions.

## Phase 2 — Adult-Initiated Student Invitation

Add:

- Parent / Coach account-first onboarding
- Invite Student
- Student acceptance
- Student ownership preservation
- simple multi-Student selector where needed

## Later

Possible:

- granular sharing controls
- Student-approved Reflection sharing
- coach caseload tools
- invite by QR / link
- guardian consent workflows
- organization-managed relationships
- Supporter notes / Interventions
- additional Supporter roles

---

# 34. Product Learning Questions

1. Do Students understand what access a Parent or Coach receives?
2. Are Students comfortable initiating Support relationships?
3. How often do adults initiate onboarding instead?
4. Does Student ownership remain clear in adult-initiated onboarding?
5. Do Students remove or change Supporters?
6. Do adults understand supporting versus managing?
7. Is role-level access sufficient before granular permissions?
8. Do Coaches commonly support multiple Students?
9. Does invitation setup create unnecessary friction?
10. Do Reflection or privacy needs force granular controls earlier than expected?

---

# 35. Definition of Success

The primary flow succeeds when a Student can say:

> **I chose who can support me, and I can see who has access.**

The adult-initiated flow succeeds when:

> **A Parent or Coach can help a Student get started without becoming the owner of the Student's planning experience.**

The long-term model should allow meaningful adult support while preserving Student agency, privacy, and ownership.
