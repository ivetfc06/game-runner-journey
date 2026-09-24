import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, haversine, type Pos, syncMissions, useProfile, useUser } from "@/lib/game";

export function useChests() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ["chests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [{ data: chests, error }, { data: claims }] = await Promise.all([
        supabase.from("chests").select("*").eq("active", true).order("created_at"),
        supabase.from("chest_claims").select("chest_id").gte("claimed_at", since),
      ]);
      if (error) throw error;
      const claimed = new Set((claims ?? []).map((c) => c.chest_id));
      return (chests ?? []).map((c) => ({ ...c, claimed: claimed.has(c.id) }));
    },
  });
}

/** While a GPS position is available, auto-open any chest within ~35 m. */
export function useAutoClaim(pos: Pos | null, enabled: boolean) {
  const { data: chests } = useChests();
  const qc = useQueryClient();
  const { data: prof } = useProfile();
  const radius = ((prof as { magnet_runs?: number } | undefined)?.magnet_runs ?? 0) > 0 ? 85 : 35;
  const trying = useRef(new Set<string>());
  const spawned = useRef(false);

  // Al empezar la carrera, genera cofres alrededor del jugador (separados entre sí)
  useEffect(() => {
    if (!enabled) { spawned.current = false; return; }
    if (!pos || spawned.current) return;
    spawned.current = true;
    (supabase.rpc as unknown as (n: string, a: object) => Promise<{ data: number | null }>)("spawn_nearby_chests", { _lat: pos.lat, _lng: pos.lng })
      .then(({ data }) => { if (data) qc.invalidateQueries({ queryKey: ["chests"] }); });
  }, [enabled, pos, qc]);

  useEffect(() => {
    if (!enabled || !pos || !chests) return;
    for (const c of chests) {
      if (c.claimed || trying.current.has(c.id)) continue;
      if (haversine(pos, c) > radius) continue;
      trying.current.add(c.id);
      supabase
        .rpc("claim_chest", { _chest: c.id, _lat: pos.lat, _lng: pos.lng })
        .then(({ data, error }) => {
          if (error) {
            trying.current.delete(c.id);
            toast.error(errMsg(error));
            return;
          }
          const r = data as { coins: number; xp: number; name: string };
          toast.success(`🎁 Chest opened: ${r.name}! +${r.coins} coins · +${r.xp} XP`);
          qc.invalidateQueries({ queryKey: ["chests"] });
          qc.invalidateQueries({ queryKey: ["inventory"] });
          qc.invalidateQueries({ queryKey: ["profile"] });
          void syncMissions(qc);
        });
    }
  }, [pos, enabled, chests, qc, radius]);
}

export const RARITY_LABEL: Record<string, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold" };

export function useInventory() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ["inventory", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chest_claims")
        .select("id, claimed_at, chests(name, rarity, coins, xp)")
        .order("claimed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}
