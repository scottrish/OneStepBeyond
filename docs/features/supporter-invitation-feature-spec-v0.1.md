# Executive Function Coach

## Supporter Invitation & Onboarding — Feature Specification

Version 0.1

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

Conceptual model:

```text
User
- id
- email
- displayName

StudentProfile
- userId

SupporterProfile
- userId

SupportRelationship
- id
- studentUserId
- supporterUserId
- role
- status
- invitedBy
- invitedAt
- acceptedAt
- endedAt

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

Exact persistence is implementation-specific.

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
