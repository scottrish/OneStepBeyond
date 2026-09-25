-- Separate Saturday and Sunday study hours
-- (docs/features/study-hours-v2-proposal.md §1;
-- docs/decisions/20260925-split-weekend-study-hours.md).
--
-- Replaces the single weekend_hours budget with one per weekend day.
-- Defaults are 2 hours each for a student who has never saved study
-- hours (the app's DEFAULT_PREFERENCES matches; a student with no row
-- uses those instead of these column defaults).
--
-- Existing rows keep what the student saved, copied to both days, capped
-- at 8 and rounded to the nearest half hour so the stepper (0-8 in 0.5
-- steps) can show it. The old default of 10, saved by anyone who pressed
-- Save without changing it, becomes 8.
--
-- No RLS change: every policy on this table checks student_id only, and
-- the grants are table-level, so they cover the new columns.

alter table public.student_preferences
  add column saturday_hours numeric not null default 2
    check (saturday_hours between 0 and 8),
  add column sunday_hours numeric not null default 2
    check (sunday_hours between 0 and 8);

update public.student_preferences
set
  saturday_hours = least(8, round(weekend_hours * 2) / 2),
  sunday_hours = least(8, round(weekend_hours * 2) / 2);

alter table public.student_preferences drop column weekend_hours;
