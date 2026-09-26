# Offline actions: a queue beside the offline plan, sent directly when online

Date: 2026-09-26

## Context

`pwa-phase-2-offline-v0.1.md` increment 2c makes a student's
mid-session actions work offline. They're queued on the device and sent
when the connection returns (`20260925-pwa-phase-2-approach.md`, W3). The
2c analysis raised six points, settled on 2026-09-26 as recommended:

- **Q1 — "ticking a step":** Assignment Detail has no tick control (its
  checkboxes are disabled). A step is completed by Today's Done, so
  that's what works offline. No new control.
- **Q2 — the whole Done flow works offline.** That covers the session,
  the step, "Yes — clear the other time", "Yes, mark it complete" and
  both reflections, so finishing offline goes the same way as online.
- **Q3 — one conflict note,** at the top of the screen, until OK.
- **Q4 — no Background Sync.** Send when the connection returns or the
  app is brought to the front.
- **Q5 — direct when online** (below).
- **Q6 — Assignment Detail's two reads are stored too**, since Today
  links there.

Three design choices weren't obvious.

## Decision

1. **Send directly when possible; queue only when necessary (Q5).**
   A write goes straight to the server, exactly as before, when nothing
   is waiting and the server is reachable. It's queued when:
   - the app is offline;
   - something is already waiting, so order is kept (Start before Done);
   - or sending fails for lack of a connection.
   
   Online behaviour is unchanged, including immediate errors.
2. **Waiting actions are shown when data is read, not written into the
   stored copies.** `cachedRead` applies the waiting actions (a pure
   function, `src/domain/offlineActions.ts` `applyPending`) to every
   read of the student's own data, fresh or stored. Actions sent while a
   read was on its way are applied too, so a reply assembled just before
   they arrived doesn't show an older state. One rule covers Today,
   Home, Plan, Look Ahead and Assignment Detail. It also covers reloads,
   and actions that are stuck after three failures.
3. **Safe to send twice without a migration.** Each write
   (`src/services/offlineSenders.ts`) is either guarded or an insert
   that ignores duplicates:
   - Updates are guarded to the state they change from, for example Start
     only while `planned`, and Done only while not `done`. If a guarded
     update changes nothing, the row is looked up. If it's still there,
     it's already as the student wanted: a repeat, or done on another
     device, so nothing is lost and nothing is said. If it's gone, it's a
     conflict: the action is dropped, with one calm note.
   - Inserts (reflections, coaching records) carry an id made on the
     device and ignore duplicates. A foreign-key failure means what they
     belonged to was removed, which is also a conflict.
   - Times are the device's, sent explicitly. That includes
     `reflections.occurred_at` and `coaching_interactions.created_at`,
     which would otherwise be the server's `now()`.

The queue (`src/services/offlineQueue.ts`):
- lives in the 2b IndexedDB store under `{studentId}:queue`;
- sends one action at a time, in order, and only as the signed-in
  student after `getSession()`, which refreshes the token;
- runs under a Web Lock where available, so two open copies of the app
  take turns;
- keeps its actions when a sign-in expires, and sends them when the same
  student signs back in;
- discards them, with a console note, when a different student signs in;
- discards them when the student signs out, after Settings warns;
- retries a real failure after 1 s and 5 s, then marks it stuck, which
  blocks the actions behind it. Settings then offers Try again and
  Discard.

## Alternatives considered

- **Always queue, even online:** one path, but every server error
  becomes delayed and indirect, and online behaviour would change
  everywhere.
- **Patching the stored copies when an action is queued:** each read
  (seven keys, two for Assignment Detail) would need its own patch at
  write time, and a fresh read from the server before the send would
  overwrite the patch.
- **Server-side guards (Postgres functions, a `client_action_id`
  column):** stronger, but a migration and new functions. The guarded
  updates give the same "twice = once" result with the tables as they
  are.
- **Background Sync:** a bonus where it exists (not on iPhones). It
  would mean giving the service worker the student's login token.

## Consequences

- Hooks and screens needed almost no changes. The services return the
  device's values straight away, whether the action was sent or queued.
  Today's "clear the other time" now calls `clearWorkSession` (works
  offline, never removes a done session). Plan's Remove still calls
  `deleteWorkSession`, which is online only.
- Assignment Detail's "Mark assignment complete" now completes the steps
  first (online only) and then the assignment (works offline). Offline,
  it stops with "You'll need to be online to do this." rather than
  completing half. Its errors are now shown on the page, where before
  they weren't shown at all.
- Need more time sends absolute minutes. If the estimate was changed on
  another device meanwhile, the student's latest choice wins.
- Two open copies of the app, each adding actions while the other sends,
  could overwrite each other's stored queue. That's rare on a phone, and
  the guards make any double send harmless.
- iOS may delete a website's storage after 7 days without use. An app
  installed to the home screen is exempt, and that's what offline is for.
