-- Roles
create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  xp integer not null default 0,
  coins integer not null default 200,
  total_km numeric(10,2) not null default 0,
  streak integer not null default 0,
  last_run_date date,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (display_name, username) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base text; uname text;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1), 'runner'), '[^a-zA-Z0-9_]', '', 'g'));
  if length(base) < 3 then base := 'runner'; end if;
  uname := base;
  while exists (select 1 from public.profiles where username = uname) loop
    uname := base || floor(random()*10000)::text;
  end loop;
  insert into public.profiles (id, username, display_name)
  values (new.id, uname, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', uname));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Friendships
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references public.profiles(id) on delete cascade,
  addressee uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);
create unique index friendships_pair on public.friendships (least(requester,addressee), greatest(requester,addressee));
grant select, insert, delete on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated;
grant all on public.friendships to service_role;
alter table public.friendships enable row level security;
create policy "see own friendships" on public.friendships for select to authenticated using (auth.uid() in (requester, addressee));
create policy "send request" on public.friendships for insert to authenticated with check (requester = auth.uid() and status = 'pending');
create policy "accept request" on public.friendships for update to authenticated using (addressee = auth.uid()) with check (addressee = auth.uid() and status = 'accepted');
create policy "remove friendship" on public.friendships for delete to authenticated using (auth.uid() in (requester, addressee));

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friendships where status='accepted' and ((requester=a and addressee=b) or (requester=b and addressee=a)))
$$;

-- Races
create table public.races (
  id uuid primary key default gen_random_uuid(),
  creator uuid not null references public.profiles(id) on delete cascade,
  opponent uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('async','live')),
  distance_km numeric(5,2) not null,
  stake integer not null default 0,
  status text not null default 'pending' check (status in ('pending','active','finished','cancelled','expired')),
  deadline timestamptz,
  winner uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
grant select on public.races to authenticated;
grant all on public.races to service_role;
alter table public.races enable row level security;
create policy "participants see races" on public.races for select to authenticated using (auth.uid() in (creator, opponent));

create table public.race_progress (
  race_id uuid not null references public.races(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  distance_km numeric(6,3) not null default 0,
  time_seconds integer,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (race_id, user_id)
);
grant select on public.race_progress to authenticated;
grant all on public.race_progress to service_role;
alter table public.race_progress enable row level security;
create policy "participants see progress" on public.race_progress for select to authenticated
  using (exists (select 1 from public.races r where r.id = race_id and auth.uid() in (r.creator, r.opponent)));

alter publication supabase_realtime add table public.race_progress;
alter publication supabase_realtime add table public.races;

-- Chests
create table public.chests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  rarity text not null default 'bronze' check (rarity in ('bronze','silver','gold')),
  coins integer not null default 20,
  xp integer not null default 50,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.chests to authenticated;
grant insert, update, delete on public.chests to authenticated;
grant all on public.chests to service_role;
alter table public.chests enable row level security;
create policy "chests readable" on public.chests for select to authenticated using (true);
create policy "admin insert chests" on public.chests for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update chests" on public.chests for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete chests" on public.chests for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.chest_claims (
  id uuid primary key default gen_random_uuid(),
  chest_id uuid not null references public.chests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  claimed_at timestamptz not null default now()
);
grant select on public.chest_claims to authenticated;
grant all on public.chest_claims to service_role;
alter table public.chest_claims enable row level security;
create policy "own claims" on public.chest_claims for select to authenticated using (user_id = auth.uid());

insert into public.chests (name, lat, lng, rarity, coins, xp) values
 ('Estanque del Retiro', 40.41810, -3.68330, 'gold', 150, 300),
 ('Palacio de Cristal', 40.41380, -3.68200, 'silver', 80, 150),
 ('Templo de Debod', 40.42400, -3.71770, 'gold', 150, 300),
 ('Madrid Río · Puente de Toledo', 40.40330, -3.71380, 'silver', 80, 150),
 ('Lago de la Casa de Campo', 40.41990, -3.73400, 'bronze', 40, 80),
 ('Plaza Mayor', 40.41550, -3.70740, 'bronze', 40, 80),
 ('Parque del Oeste · Rosaleda', 40.42800, -3.72300, 'bronze', 40, 80),
 ('Puerta de Alcalá', 40.42000, -3.68880, 'silver', 80, 150);

-- Helpers
create or replace function public.grant_reward(_uid uuid, _coins int, _xp int)
returns void language sql security definer set search_path = public as $$
  update public.profiles set coins = coins + _coins, xp = xp + _xp where id = _uid;
$$;
revoke execute on function public.grant_reward(uuid,int,int) from public, anon, authenticated;

-- Free run
create or replace function public.finish_run(_km numeric, _seconds int)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); km numeric; xp_gain int; coin_gain int; p public.profiles;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  km := least(greatest(coalesce(_km,0),0), 60);
  if _seconds is null or _seconds < km * 120 then raise exception 'ritmo imposible'; end if;
  xp_gain := floor(km * 100);
  coin_gain := floor(km * 10);
  select * into p from public.profiles where id = uid for update;
  update public.profiles set
    xp = xp + xp_gain, coins = coins + coin_gain, total_km = total_km + km,
    streak = case when last_run_date = current_date then streak when last_run_date = current_date - 1 then streak + 1 else 1 end,
    last_run_date = current_date
  where id = uid;
  return json_build_object('xp', xp_gain, 'coins', coin_gain);
end $$;

-- Chest claim
create or replace function public.claim_chest(_chest uuid, _lat double precision, _lng double precision)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c public.chests; dist double precision;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into c from public.chests where id = _chest and active;
  if not found then raise exception 'cofre no encontrado'; end if;
  dist := 6371000 * 2 * asin(sqrt(power(sin(radians(c.lat - _lat)/2),2) + cos(radians(_lat))*cos(radians(c.lat))*power(sin(radians(c.lng - _lng)/2),2)));
  if dist > 40 then raise exception 'Estás demasiado lejos del cofre (% m)', round(dist); end if;
  if exists (select 1 from public.chest_claims where chest_id = _chest and user_id = uid and claimed_at > now() - interval '24 hours') then
    raise exception 'Ya abriste este cofre hoy';
  end if;
  insert into public.chest_claims (chest_id, user_id) values (_chest, uid);
  perform public.grant_reward(uid, c.coins, c.xp);
  return json_build_object('coins', c.coins, 'xp', c.xp, 'name', c.name);
end $$;

-- Races
create or replace function public.create_race(_opponent uuid, _mode text, _distance numeric, _stake int, _hours int)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rid uuid; bal int;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if not public.are_friends(uid, _opponent) then raise exception 'Solo puedes retar a tus amigos'; end if;
  if _mode not in ('async','live') then raise exception 'modo inválido'; end if;
  if _distance not in (1,3,5,10) then raise exception 'distancia inválida'; end if;
  if _stake < 0 or _stake > 10000 then raise exception 'apuesta inválida'; end if;
  select coins into bal from public.profiles where id = uid for update;
  if bal < _stake then raise exception 'No tienes monedas suficientes'; end if;
  update public.profiles set coins = coins - _stake where id = uid;
  insert into public.races (creator, opponent, mode, distance_km, stake, deadline)
  values (uid, _opponent, _mode, _distance, _stake, case when _mode='async' then now() + make_interval(hours => case when _hours = 48 then 48 else 24 end) else now() + interval '24 hours' end)
  returning id into rid;
  return rid;
end $$;

create or replace function public.respond_race(_race uuid, _accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r public.races; bal int;
begin
  select * into r from public.races where id = _race for update;
  if not found or r.status <> 'pending' then raise exception 'reto no disponible'; end if;
  if _accept then
    if uid <> r.opponent then raise exception 'no autorizado'; end if;
    select coins into bal from public.profiles where id = uid for update;
    if bal < r.stake then raise exception 'No tienes monedas suficientes'; end if;
    update public.profiles set coins = coins - r.stake where id = uid;
    update public.races set status = 'active' where id = _race;
    insert into public.race_progress (race_id, user_id) values (_race, r.creator), (_race, r.opponent) on conflict do nothing;
  else
    if uid not in (r.creator, r.opponent) then raise exception 'no autorizado'; end if;
    update public.races set status = 'cancelled' where id = _race;
    update public.profiles set coins = coins + r.stake where id = r.creator;
  end if;
end $$;

create or replace function public.settle_race(_race uuid, _winner uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.races;
begin
  select * into r from public.races where id = _race for update;
  if r.status <> 'active' then return; end if;
  update public.races set status = 'finished', winner = _winner where id = _race;
  if _winner is null then
    update public.profiles set coins = coins + r.stake where id in (r.creator, r.opponent);
  else
    perform public.grant_reward(_winner, r.stake * 2 + 100, 250);
    perform public.grant_reward(case when _winner = r.creator then r.opponent else r.creator end, 0, 50);
  end if;
end $$;
revoke execute on function public.settle_race(uuid,uuid) from public, anon, authenticated;

create or replace function public.update_race_progress(_race uuid, _km numeric, _seconds int)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r public.races; mine public.race_progress; other public.race_progress; km numeric;
begin
  select * into r from public.races where id = _race;
  if not found or uid not in (r.creator, r.opponent) then raise exception 'no autorizado'; end if;
  if r.status <> 'active' then return json_build_object('status', r.status, 'winner', r.winner); end if;
  if r.deadline < now() and r.mode = 'async' then
    perform public.resolve_race(_race);
    select * into r from public.races where id = _race;
    return json_build_object('status', r.status, 'winner', r.winner);
  end if;
  select * into mine from public.race_progress where race_id = _race and user_id = uid for update;
  if mine.finished_at is not null then return json_build_object('status', r.status); end if;
  km := least(greatest(coalesce(_km,0), mine.distance_km), r.distance_km);
  if _seconds is null or _seconds < km * 120 then raise exception 'ritmo imposible'; end if;
  update public.race_progress set distance_km = km, updated_at = now(),
    finished_at = case when km >= r.distance_km then now() else null end,
    time_seconds = case when km >= r.distance_km then _seconds else null end
  where race_id = _race and user_id = uid;
  if km >= r.distance_km then
    if r.mode = 'live' then
      perform public.settle_race(_race, uid);
    else
      select * into other from public.race_progress where race_id = _race and user_id <> uid;
      if other.time_seconds is not null then
        perform public.settle_race(_race, case when other.time_seconds < _seconds then other.user_id when other.time_seconds > _seconds then uid else null end);
      end if;
    end if;
  end if;
  select * into r from public.races where id = _race;
  return json_build_object('status', r.status, 'winner', r.winner);
end $$;

create or replace function public.resolve_race(_race uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.races; a public.race_progress; b public.race_progress;
begin
  select * into r from public.races where id = _race;
  if not found or r.deadline > now() then return; end if;
  if r.status = 'pending' then
    update public.races set status = 'expired' where id = _race;
    update public.profiles set coins = coins + r.stake where id = r.creator;
  elsif r.status = 'active' then
    select * into a from public.race_progress where race_id = _race and user_id = r.creator;
    select * into b from public.race_progress where race_id = _race and user_id = r.opponent;
    if a.time_seconds is not null and b.time_seconds is null then perform public.settle_race(_race, r.creator);
    elsif b.time_seconds is not null and a.time_seconds is null then perform public.settle_race(_race, r.opponent);
    else perform public.settle_race(_race, null); end if;
  end if;
end $$;