-- The admin log (docs/features/admin-action-log-v0.1.md): every admin
-- action across all accounts, for the "Admin log" view on /admin.
--
-- Read-only, and superuser-only, like the admin page's other functions
-- (20260926120000_admin_account_management.sql). public.admin_actions
-- itself stays closed — row level security, no policies, no grants —
-- so these functions are the only way to read it.

-- The log's own ordering, tie-break included (the existing index is per
-- account).
create index admin_actions_created_idx on public.admin_actions (created_at desc, id);

-- A page of the log, newest first, with the admin's and the account's
-- emails (null once an account is deleted: entries outlive accounts) and
-- the total. Every filter is optional; `p_from` is inclusive, `p_to`
-- exclusive — the app turns the viewer's local days into these (G2).
create function public.admin_list_actions(
  p_action text default null,
  p_admin_id uuid default null,
  p_account_search text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  created_at timestamptz,
  action text,
  categories text[],
  also_disabled boolean,
  counts jsonb,
  admin_id uuid,
  admin_email text,
  target_user_id uuid,
  target_email text,
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
  select
    aa.id,
    aa.created_at,
    aa.action,
    aa.categories,
    aa.also_disabled,
    aa.counts,
    aa.admin_id,
    ad.email::text,
    aa.target_user_id,
    tg.email::text,
    count(*) over ()
  from public.admin_actions aa
  left join auth.users ad on ad.id = aa.admin_id
  left join auth.users tg on tg.id = aa.target_user_id
  where (p_action is null or aa.action = p_action)
    and (p_admin_id is null or aa.admin_id = p_admin_id)
    and (p_account_search is null or p_account_search = '' or tg.email ilike '%' || p_account_search || '%')
    and (p_from is null or aa.created_at >= p_from)
    and (p_to is null or aa.created_at < p_to)
  order by aa.created_at desc, aa.id
  limit greatest(least(p_limit, 200), 1)
  offset greatest(p_offset, 0);
end;
$$;

-- The admins who appear in the log, for the Admin filter — including one
-- whose account has since been deleted (null email).
create function public.admin_list_log_admins()
returns table (admin_id uuid, admin_email text)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform admin_private.require_superuser();
  return query
  select distinct aa.admin_id, ad.email::text
  from public.admin_actions aa
  left join auth.users ad on ad.id = aa.admin_id
  order by 2 nulls last;
end;
$$;

revoke all on function public.admin_list_actions(text, uuid, text, timestamptz, timestamptz, integer, integer) from public, anon;
revoke all on function public.admin_list_log_admins() from public, anon;
grant execute on function public.admin_list_actions(text, uuid, text, timestamptz, timestamptz, integer, integer) to authenticated;
grant execute on function public.admin_list_log_admins() to authenticated;
