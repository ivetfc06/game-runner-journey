alter table public.profiles
  add column if not exists week_key date,
  add column if not exists week_runs integer not null default 0,
  add column if not exists weekly_streak integer not null default 0,
  add column if not exists best_weekly_streak integer not null default 0,
  add column if not exists last_done_week date;

create or replace function public.track_week()
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  wk date := date_trunc('week', now())::date;
  p public.profiles%rowtype;
  done boolean := false;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into p from public.profiles where id = uid for update;
  if p.week_key is distinct from wk then
    p.week_key := wk; p.week_runs := 0;
  end if;
  p.week_runs := p.week_runs + 1;
  if p.week_runs = 3 and p.last_done_week is distinct from wk then
    if p.last_done_week = wk - 7 then p.weekly_streak := p.weekly_streak + 1;
    else p.weekly_streak := 1; end if;
    p.last_done_week := wk;
    p.best_weekly_streak := greatest(p.best_weekly_streak, p.weekly_streak);
    done := true;
  end if;
  update public.profiles set week_key = p.week_key, week_runs = p.week_runs,
    weekly_streak = p.weekly_streak, last_done_week = p.last_done_week,
    best_weekly_streak = p.best_weekly_streak where id = uid;
  if done then perform public.grant_reward(uid, 50 + 10 * p.weekly_streak, 100 + 20 * p.weekly_streak); end if;
  return json_build_object('week_runs', p.week_runs, 'completed', done, 'weekly_streak', p.weekly_streak);
end $$;
revoke all on function public.track_week() from public, anon;
grant execute on function public.track_week() to authenticated;