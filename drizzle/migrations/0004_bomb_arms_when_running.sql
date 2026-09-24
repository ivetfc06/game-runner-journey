CREATE OR REPLACE FUNCTION public.update_streaks(_km numeric, _seconds integer, _elev numeric)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare uid uuid := auth.uid(); p public.profiles; elev numeric; pace numeric;
  d_ok boolean := false; e_ok boolean := false; s_ok boolean := false; exploded boolean := false; lost int := 0;
  coins int := 0; xp int := 0;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if _km < 0.05 or _seconds < _km * 120 then raise exception 'carrera no válida'; end if;
  elev := least(greatest(_elev, 0), _km * 150);
  pace := _seconds / _km;
  select * into p from public.profiles where id = uid for update;
  if _km >= p.dist_target then
    d_ok := true; p.dist_streak := p.dist_streak + 1; p.dist_target := p.dist_target + 0.5;
    coins := coins + 20 + 5 * p.dist_streak; xp := xp + 50 + 10 * p.dist_streak;
  end if;
  if elev >= p.elev_target then
    e_ok := true; p.elev_streak := p.elev_streak + 1; p.elev_target := p.elev_target + 25;
    coins := coins + 20 + 5 * p.elev_streak; xp := xp + 50 + 10 * p.elev_streak;
  end if;
  if _km >= p.speed_target_km and pace <= p.speed_target_pace then
    s_ok := true; p.speed_streak := p.speed_streak + 1; p.speed_target_pace := greatest(240, p.speed_target_pace - 5);
    coins := coins + 30 + 5 * p.speed_streak; xp := xp + 75 + 10 * p.speed_streak;
  elsif _km >= 0.3 then
    -- la bomba solo se arma cuando ya has empezado a correr (>= 300 m)
    exploded := true; lost := ceil(p.speed_streak * 0.25);
    p.speed_streak := p.speed_streak - lost;
    p.speed_target_pace := least(420, p.speed_target_pace + 5 * lost);
  end if;
  update public.profiles set dist_streak = p.dist_streak, dist_target = p.dist_target,
    elev_streak = p.elev_streak, elev_target = p.elev_target,
    speed_streak = p.speed_streak, speed_target_pace = p.speed_target_pace where id = uid;
  if coins > 0 or xp > 0 then perform public.grant_reward(uid, coins, xp); end if;
  return json_build_object('dist_ok', d_ok, 'elev_ok', e_ok, 'speed_ok', s_ok, 'exploded', exploded,
    'lost', lost, 'coins', coins, 'xp', xp, 'dist_streak', p.dist_streak, 'elev_streak', p.elev_streak, 'speed_streak', p.speed_streak);
end $function$;