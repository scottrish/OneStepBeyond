-- Activities amendment (docs/features/activities.md, "Amendment: split
-- travel time into 'travel to' and 'travel from'"). A single symmetric
-- travel_minutes value can't represent an activity with real travel one
-- direction but none the other (e.g. starts right after school, at
-- school — no travel-to, real travel-from getting home).
--
-- Existing rows: copy the old single value into *both* new columns
-- rather than guessing which side it was meant to represent — preserves
-- today's symmetric behavior exactly for every activity that hasn't been
-- touched yet, per the amendment's own decision.

alter table public.activities
  add column travel_to_minutes integer not null default 0 check (travel_to_minutes >= 0),
  add column travel_from_minutes integer not null default 0 check (travel_from_minutes >= 0);

update public.activities
set travel_to_minutes = travel_minutes,
    travel_from_minutes = travel_minutes;

alter table public.activities
  drop column travel_minutes;
