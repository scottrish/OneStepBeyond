-- Admin account management (docs/features/admin-account-management-v0.1.md;
-- docs/decisions/20260926-admin-account-management.md).
--
-- A superuser can list every account, turn an account off or on, and clear
-- an account's data by category — through the functions below, and only
-- through them. Each public function first checks that the caller is in
-- public.superusers (A1); the browser never holds the service-role key.
--
-- Turning an account off (A3) sets auth.users.banned_until far in the
-- future (not 'infinity', which the auth server can't read — a 500 on
-- sign-in) and deletes the account's sessions, which revokes its refresh
-- tokens (auth.refresh_tokens.session_id cascades). Its current access
-- token keeps working until it expires (up to an hour); after that it's
-- signed out, and signing in fails with `user_banned`.
--
-- Every change is recorded in public.admin_actions (A4). Superuser status
-- is still only ever granted in the database (supporter-role-based-access
-- §7.3): nothing here writes to public.superusers.

-- ——— The record of admin actions (A4) ———

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  -- No foreign keys: the record outlives any account it mentions.
  admin_id uuid not null,
  target_user_id uuid not null,
  action text not null check (action in ('disable', 'enable', 'clear')),
  categories text[] not null default '{}',
  also_disabled boolean not null default false,
  -- What was removed, per table (clear only).
  counts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_actions_target_idx on public.admin_actions (target_user_id, created_at desc);

-- Row level security on, no policies and no grants: nobody reads or writes
-- the table directly. It's written only by the functions below, and read
-- only through admin_get_account (an account's 20 most recent actions).
alter table public.admin_actions enable row level security;

-- ——— Internal helpers: a schema the API doesn't expose ———
-- Plain (invoker) functions, called only by the security-definer functions
-- in public, so they run with those functions' rights.

create schema admin_private;
revoke all on schema admin_private from public;

create function admin_private.require_superuser() returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.superusers su where su.user_id = auth.uid()) then
    raise exception 'This is for administrators only.' using errcode = '42501';
  end if;
end;
$$;

-- An account an admin may change. Another superuser never (A6); yourself
-- only when `allow_self` (clearing your own data is allowed — Q2 — turning
-- yourself off isn't).
create function admin_private.check_target(p_user uuid, p_allow_self boolean) returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from auth.users u where u.id = p_user) then
    raise exception 'That account doesn''t exist.' using errcode = 'P0002';
  end if;
  if p_user = auth.uid() then
    if not p_allow_self then
      raise exception 'You can''t turn off your own account.' using errcode = '42501';
    end if;
    return;
  end if;
  if exists (select 1 from public.superusers su where su.user_id = p_user) then
    raise exception 'Admin accounts can''t be changed here.' using errcode = '42501';
  end if;
end;
$$;

-- Every account, with its status, roles (worked out from its data) and a
-- few counts.
create function admin_private.accounts()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  status text,
  is_student boolean,
  is_supporter boolean,
  is_admin boolean,
  course_count bigint,
  assignment_count bigint,
  planned_session_count bigint
)
language sql
stable
set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    case
      when u.banned_until is not null and u.banned_until > now() then 'disabled'
      when u.last_sign_in_at is null then 'never_signed_in'
      else 'active'
    end,
    exists (select 1 from public.courses c where c.student_id = u.id)
      or exists (select 1 from public.assignments a where a.student_id = u.id)
      or exists (select 1 from public.activities ac where ac.student_id = u.id)
      or exists (select 1 from public.student_preferences p where p.student_id = u.id)
      or exists (select 1 from public.support_relationships sr where sr.student_id = u.id)
      -- Plan history has no link to courses, so it can outlive them (a
      -- student who deleted all their courses after planning).
      or exists (select 1 from public.planning_sessions ps where ps.student_id = u.id),
    exists (select 1 from public.support_relationships sr where sr.supporter_id = u.id),
    exists (select 1 from public.superusers su where su.user_id = u.id),
    (select count(*) from public.courses c where c.student_id = u.id),
    (select count(*) from public.assignments a where a.student_id = u.id),
    (select count(*) from public.work_sessions w where w.student_id = u.id and w.status <> 'done')
  from auth.users u
$$;

-- How many rows of each kind an account has, for "what was removed".
create function admin_private.counts(p_user uuid) returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'courses', (select count(*) from public.courses where student_id = p_user),
    'assignments', (select count(*) from public.assignments where student_id = p_user),
    'work_items', (select count(*) from public.work_items where student_id = p_user),
    'work_sessions', (select count(*) from public.work_sessions where student_id = p_user),
    'planning_sessions', (select count(*) from public.planning_sessions where student_id = p_user),
    'decomposition_attempts', (select count(*) from public.decomposition_attempts where student_id = p_user),
    'reflections', (select count(*) from public.reflections where student_id = p_user),
    'coaching_interactions', (select count(*) from public.coaching_interactions where student_id = p_user),
    'activities', (select count(*) from public.activities where student_id = p_user),
    'student_preferences', (select count(*) from public.student_preferences where student_id = p_user),
    'support_relationships', (
      select count(*) from public.support_relationships
      where student_id = p_user or supporter_id = p_user
    )
  )
$$;

-- before − after, keeping only the tables that lost rows.
create function admin_private.removed(p_before jsonb, p_after jsonb) returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(b.key, (b.value::bigint - (p_after ->> b.key)::bigint)),
    '{}'::jsonb
  )
  from jsonb_each_text(p_before) b
  where b.value::bigint > (p_after ->> b.key)::bigint
$$;

-- The categories (requirement 3). Each also removes what depends on it,
-- through the tables' own on-delete cascades.
create function admin_private.delete_categories(p_user uuid, p_categories text[]) returns void
language plpgsql
set search_path = ''
as $$
declare
  unknown text;
begin
  if coalesce(array_length(p_categories, 1), 0) = 0 then
    raise exception 'Choose what to clear.' using errcode = '22023';
  end if;
  select c into unknown
  from unnest(p_categories) c
  where c not in ('courses', 'assignments', 'plans', 'history', 'activities', 'study_hours', 'support')
  limit 1;
  if unknown is not null then
    raise exception 'Unknown category: %', unknown using errcode = '22023';
  end if;

  -- Courses and all school work: assignments, steps, sessions, breakdown
  -- attempts, reflections and coaching cascade; plan history too (Q4).
  if 'courses' = any (p_categories) then
    delete from public.courses where student_id = p_user;
    delete from public.planning_sessions where student_id = p_user;
  end if;
  -- Assignments, keeping courses.
  if 'assignments' = any (p_categories) then
    delete from public.assignments where student_id = p_user;
  end if;
  -- Plans, keeping assignments and steps.
  if 'plans' = any (p_categories) then
    delete from public.work_sessions where student_id = p_user;
    delete from public.planning_sessions where student_id = p_user;
  end if;
  -- Reflections and coaching history.
  if 'history' = any (p_categories) then
    delete from public.reflections where student_id = p_user;
    delete from public.decomposition_attempts where student_id = p_user;
    delete from public.coaching_interactions where student_id = p_user;
  end if;
  if 'activities' = any (p_categories) then
    delete from public.activities where student_id = p_user;
  end if;
  -- Study hours: the defaults apply again.
  if 'study_hours' = any (p_categories) then
    delete from public.student_preferences where student_id = p_user;
  end if;
  -- Support relationships from either side, pending invitations included.
  if 'support' = any (p_categories) then
    delete from public.support_relationships where student_id = p_user or supporter_id = p_user;
  end if;
end;
$$;

create function admin_private.set_disabled(p_user uuid, p_disabled boolean) returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_disabled then
    update auth.users set banned_until = now() + interval '100 years' where id = p_user;
    -- Revokes its refresh tokens: auth.refresh_tokens cascades.
    delete from auth.sessions where user_id = p_user;
  else
    update auth.users set banned_until = null where id = p_user;
  end if;
end;
$$;

-- ——— What the admin page calls ———

create function public.admin_list_accounts(
  p_search text default null,
  p_status text default null,
  p_role text default null,
  p_sort text default 'created_desc',
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  status text,
  is_student boolean,
  is_supporter boolean,
  is_admin boolean,
  course_count bigint,
  assignment_count bigint,
  planned_session_count bigint,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform admin_private.require_superuser();
  return query
  with filtered as (
    select a.*
    from admin_private.accounts() a
    where (p_search is null or p_search = '' or a.email ilike '%' || p_search || '%')
      and (p_status is null or a.status = p_status)
      and (
        p_role is null
        or (p_role = 'student' and a.is_student)
        or (p_role = 'supporter' and a.is_supporter)
        or (p_role = 'admin' and a.is_admin)
        or (p_role = 'none' and not a.is_student and not a.is_supporter and not a.is_admin)
      )
  )
  select f.*, count(*) over ()
  from filtered f
  order by
    case when p_sort = 'email_asc' then f.email end asc,
    case when p_sort = 'email_desc' then f.email end desc,
    case when p_sort = 'created_asc' then f.created_at end asc,
    case when p_sort = 'last_sign_in_desc' then f.last_sign_in_at end desc nulls last,
    case when p_sort = 'last_sign_in_asc' then f.last_sign_in_at end asc nulls first,
    f.created_at desc
  limit greatest(least(p_limit, 200), 1)
  offset greatest(p_offset, 0);
end;
$$;

-- One account: its row, its support relationships from both sides (with
-- the other person's email), and its 20 most recent admin actions.
create function public.admin_get_account(p_user uuid) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform admin_private.require_superuser();
  select jsonb_build_object(
    'account', (select to_jsonb(a) from admin_private.accounts() a where a.id = p_user),
    'as_student', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sr.id, 'role', sr.role, 'status', sr.status, 'invited_at', sr.invited_at,
        'other_email', coalesce(su.email::text, sr.invited_email)
      ) order by sr.invited_at desc)
      from public.support_relationships sr
      left join auth.users su on su.id = sr.supporter_id
      where sr.student_id = p_user
    ), '[]'::jsonb),
    'as_supporter', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sr.id, 'role', sr.role, 'status', sr.status, 'invited_at', sr.invited_at,
        'other_email', st.email::text
      ) order by sr.invited_at desc)
      from public.support_relationships sr
      join auth.users st on st.id = sr.student_id
      where sr.supporter_id = p_user
    ), '[]'::jsonb),
    'actions', coalesce((
      select jsonb_agg(x order by x.created_at desc)
      from (
        select aa.id, aa.action, aa.categories, aa.also_disabled, aa.counts, aa.created_at,
               ad.email::text as admin_email
        from public.admin_actions aa
        left join auth.users ad on ad.id = aa.admin_id
        where aa.target_user_id = p_user
        order by aa.created_at desc
        limit 20
      ) x
    ), '[]'::jsonb)
  ) into result;
  if result -> 'account' is null or result -> 'account' = 'null'::jsonb then
    raise exception 'That account doesn''t exist.' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

create function public.admin_set_disabled(p_user uuid, p_disabled boolean) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform admin_private.require_superuser();
  perform admin_private.check_target(p_user, not p_disabled);
  perform admin_private.set_disabled(p_user, p_disabled);
  insert into public.admin_actions (admin_id, target_user_id, action)
  values (auth.uid(), p_user, case when p_disabled then 'disable' else 'enable' end);
end;
$$;

-- What clearing these categories would remove, per table — worked out by
-- actually deleting inside a sub-transaction that's then rolled back, so
-- the preview and the real thing can never disagree.
create function public.admin_clear_preview(p_user uuid, p_categories text[]) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  before jsonb;
  result jsonb;
begin
  perform admin_private.require_superuser();
  perform admin_private.check_target(p_user, true);
  before := admin_private.counts(p_user);
  begin
    perform admin_private.delete_categories(p_user, p_categories);
    result := admin_private.removed(before, admin_private.counts(p_user));
    raise exception 'admin-preview-rollback';
  exception
    when raise_exception then
      if sqlerrm <> 'admin-preview-rollback' then
        raise;
      end if;
  end;
  return result;
end;
$$;

-- Clear the categories and, if asked, turn the account off — all or
-- nothing (one function call is one transaction). Returns what was removed.
create function public.admin_clear_account(p_user uuid, p_categories text[], p_also_disable boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  before jsonb;
  result jsonb;
begin
  perform admin_private.require_superuser();
  perform admin_private.check_target(p_user, not p_also_disable);
  before := admin_private.counts(p_user);
  perform admin_private.delete_categories(p_user, p_categories);
  result := admin_private.removed(before, admin_private.counts(p_user));
  if p_also_disable then
    perform admin_private.set_disabled(p_user, true);
  end if;
  insert into public.admin_actions (admin_id, target_user_id, action, categories, also_disabled, counts)
  values (auth.uid(), p_user, 'clear', p_categories, p_also_disable, result);
  return jsonb_build_object('removed', result, 'disabled', p_also_disable);
end;
$$;

-- Only signed-in users can call these (and each one then checks for a
-- superuser); functions are executable by PUBLIC unless revoked.
revoke all on function public.admin_list_accounts(text, text, text, text, integer, integer) from public, anon;
revoke all on function public.admin_get_account(uuid) from public, anon;
revoke all on function public.admin_set_disabled(uuid, boolean) from public, anon;
revoke all on function public.admin_clear_preview(uuid, text[]) from public, anon;
revoke all on function public.admin_clear_account(uuid, text[], boolean) from public, anon;
grant execute on function public.admin_list_accounts(text, text, text, text, integer, integer) to authenticated;
grant execute on function public.admin_get_account(uuid) to authenticated;
grant execute on function public.admin_set_disabled(uuid, boolean) to authenticated;
grant execute on function public.admin_clear_preview(uuid, text[]) to authenticated;
grant execute on function public.admin_clear_account(uuid, text[], boolean) to authenticated;

revoke all on all functions in schema admin_private from public, anon, authenticated;
