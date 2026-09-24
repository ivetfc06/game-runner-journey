import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, haversine, type Pos, syncMissions, useUser } from "@/lib/game";

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
  const trying = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !pos || !chests) return;
    for (const c of chests) {
      if (c.claimed || trying.current.has(c.id)) continue;
      if (haversine(pos, c) > 35) continue;
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
          toast.success(`🎁 ¡Cofre abierto: ${r.name}! +${r.coins} monedas · +${r.xp} XP`);
          qc.invalidateQueries({ queryKey: ["chests"] });
          qc.invalidateQueries({ queryKey: ["profile"] });
          void syncMissions(qc);
        });
    }
  }, [pos, enabled, chests, qc]);
}

export const RARITY_LABEL: Record<string, string> = { bronze: "Bronce", silver: "Plata", gold: "Oro" };
