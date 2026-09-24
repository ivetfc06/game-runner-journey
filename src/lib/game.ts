import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const XP_PER_LEVEL = 500;
export const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const levelProgress = (xp: number) => xp % XP_PER_LEVEL;

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLng = toR(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};
export const formatPace = (km: number, s: number) => {
  if (km < 0.05) return "–";
  const p = s / km;
  return `${Math.floor(p / 60)}'${String(Math.floor(p % 60)).padStart(2, "0")}"`;
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "Something went wrong";
}

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
}

export function useProfile() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });
}

export type Mission = {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  sort: number;
  done: boolean;
};

export function useMissions() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ["missions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toLocaleDateString("sv-SE");
      const [{ data: missions, error }, { data: done }] = await Promise.all([
        supabase.from("missions").select("*").order("sort"),
        supabase.from("user_missions").select("mission_id, day"),
      ]);
      if (error) throw error;
      const doneSet = new Set((done ?? []).filter((d) => d.day === today).map((d) => d.mission_id));
      return (missions ?? []).map((m) => ({ ...m, done: doneSet.has(m.id) })) as Mission[];
    },
  });
}

/** Checks today's missions server-side, awards XP and toasts new completions. */
export async function syncMissions(qc: QueryClient) {
  const { data, error } = await supabase.rpc("sync_missions");
  if (error) return;
  const newly = (data ?? []) as { title: string; xp: number }[];
  for (const m of newly) toast.success(`✅ Quest complete: ${m.title} · +${m.xp} XP`);
  if (newly.length) {
    qc.invalidateQueries({ queryKey: ["missions"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  }
}

export function useIsAdmin() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });
}

export type Pos = { lat: number; lng: number };

/** Tracks a run either with real GPS or a simulated pace (~5'/km, accelerated x10). */
export function useRunTracker() {
  const [running, setRunning] = useState(false);
  const mode = "gps" as const;
  const [km, setKm] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [elev, setElev] = useState(0);
  const altRef = useRef<number | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRef = useRef<Pos | null>(null);

  const stop = useCallback(() => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    watchRef.current = null;
    timerRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setKm(0);
    setSeconds(0);
    setElev(0);
    altRef.current = null;
    lastRef.current = null;
  }, []);

  const start = useCallback(
    () => {
      reset();
      setGpsError(null);
      setRunning(true);
      if (!("geolocation" in navigator)) {
        setGpsError("Your device does not support location services");
        setRunning(false);
        return;
      }
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      watchRef.current = navigator.geolocation.watchPosition(
        (p) => {
          const next = { lat: p.coords.latitude, lng: p.coords.longitude };
          setPos(next);
          if (p.coords.accuracy > 35) return;
          const alt = p.coords.altitude;
          if (alt != null) {
            const gain = altRef.current != null ? alt - altRef.current : 0;
            if (gain > 1) setElev((e) => e + gain);
            if (altRef.current == null || Math.abs(gain) > 1) altRef.current = alt;
          }
          if (lastRef.current) {
            const d = haversine(lastRef.current, next);
            if (d > 2 && d < 100) setKm((k) => k + d / 1000);
          }
          lastRef.current = next;
        },
        (e) => setGpsError(e.message || "Your location could not be accessed"),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
      );
    },
    [reset],
  );

  useEffect(() => stop, [stop]);

  return { running, mode, km, seconds, elev, pos, gpsError, start, stop, reset };
}
