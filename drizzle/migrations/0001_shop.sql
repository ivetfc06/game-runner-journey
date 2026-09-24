alter table public.profiles add column streak_freezes integer not null default 0, add column xp_boost_runs integer not null default 0;

create or replace function public.buy_item(_item text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); price int; bal int;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  price := case _item when 'streak_freeze' then 150 when 'xp_boost' then 100 else null end;
  if price is null then raise exception 'artículo no válido'; end if;
  select coins into bal from public.profiles where id = uid for update;
  if bal < price then raise exception 'No tienes monedas suficientes'; end if;
  if _item = 'streak_freeze' then
    update public.profiles set coins = coins - price, streak_freezes = streak_freezes + 1 where id = uid;
  else
    update public.profiles set coins = coins - price, xp_boost_runs = xp_boost_runs + 1 where id = uid;
  end if;
  return json_build_object('ok', true, 'price', price);
end $$;

create or replace function public.finish_run(_km numeric, _seconds int)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); km numeric; xp_gain int; coin_gain int; p public.profiles; gap int; used int := 0; boosted boolean := false; new_streak int;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  km := least(greatest(coalesce(_km,0),0), 60);
  if _seconds is null or _seconds < km * 120 then raise exception 'ritmo imposible'; end if;
  select * into p from public.profiles where id = uid for update;
  xp_gain := floor(km * 100);
  coin_gain := floor(km * 10);
  if p.xp_boost_runs > 0 and km >= 0.5 then xp_gain := xp_gain * 2; boosted := true; end if;
  gap := case when p.last_run_date is null then null else current_date - p.last_run_date end;
  if gap is null then new_streak := 1;
  elsif gap = 0 then new_streak := p.streak;
  elsif gap = 1 then new_streak := p.streak + 1;
  elsif p.streak_freezes >= gap - 1 then used := gap - 1; new_streak := p.streak + 1;
  else new_streak := 1; end if;
  update public.profiles set
    xp = xp + xp_gain, coins = coins + coin_gain, total_km = total_km + km,
    streak = new_streak, last_run_date = current_date,
    streak_freezes = streak_freezes - used,
    xp_boost_runs = xp_boost_runs - (case when boosted then 1 else 0 end)
  where id = uid;
  return json_build_object('xp', xp_gain, 'coins', coin_gain, 'freezes_used', used, 'boosted', boosted);
end $$;