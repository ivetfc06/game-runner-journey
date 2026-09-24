import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import ChestMap from "@/components/ChestMap";
import { RunPanel } from "@/components/RunPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAutoClaim, useChests } from "@/lib/chests";
import { errMsg, syncMissions, useProfile, useRunTracker } from "@/lib/game";
import { StreakHud } from "@/components/StreakHud";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/run")({
  head: () => ({
    meta: [
      { title: "Run — RunQuest" },
      { name: "description", content: "GPS free run: earn XP and coins, and open chests along the way." },
      { property: "og:title", content: "Run — RunQuest" },
      { property: "og:description", content: "GPS free run: earn XP and coins, and open chests along the way." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RunPage,
});

function RunPage() {
  const t = useRunTracker();
  const qc = useQueryClient();
  const { data: p } = useProfile();
  const { data: chests = [] } = useChests();
  const [boom, setBoom] = useState<number | null>(null);
  useAutoClaim(t.pos, t.running && t.mode === "gps");

  const finish = async () => {
    t.stop();
    if (t.km < 0.05) {
      toast("Run too short to score");
      return;
    }
    const { km, seconds, elev } = t;
    const { data, error } = await supabase.rpc("finish_run", { _km: km, _seconds: seconds });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    const r = data as { xp: number; coins: number; freezes_used: number; boosted: boolean };
    toast.success(`Run complete! +${r.xp} XP${r.boosted ? " (x2)" : ""} · +${r.coins} coins`);
    if (r.freezes_used > 0) toast(`🛡️ You used ${r.freezes_used} streak freeze(s) and kept your streak alive`);
    const { data: s } = await supabase.rpc("update_streaks", { _km: km, _seconds: seconds, _elev: elev });
    if (s) {
      const st = s as { dist_ok: boolean; elev_ok: boolean; speed_ok: boolean; exploded: boolean; lost: number; coins: number; xp: number };
      if (st.dist_ok) toast.success("📏 Distance streak beaten! Your goal increases by 0.5 km");
      if (st.elev_ok) toast.success("⛰️ Elevation streak beaten! Your goal increases by 25 m");
      if (st.speed_ok) toast.success("⚡ Speed streak beaten! Your target pace is now 5 seconds faster");
      if (st.coins) toast(`🏅 Streak reward: +${st.coins} coins · +${st.xp} XP`);
      if (st.exploded) {
        setBoom(st.lost);
        setTimeout(() => setBoom(null), 3500);
      }
    }
    const { data: wk } = await supabase.rpc("track_week");
    const wr = wk as { week_runs: number; completed: boolean; weekly_streak: number } | null;
    if (wr?.completed) toast.success(`📅 Weekly goal complete! Consistency: ${wr.weekly_streak} consecutive week(s)`);
    else if (wr) toast(`📅 Consistency: ${Math.min(wr.week_runs, 3)}/3 runs this week`);
    qc.invalidateQueries({ queryKey: ["profile"] });
    void syncMissions(qc);
    t.reset();
  };

  return (
    <AppShell>
      <h2 className="font-display text-3xl tracking-wide text-foreground">Free run</h2>
      <RunPanel t={t} onFinish={finish} />
      {p && <StreakHud p={p} km={t.km} seconds={t.seconds} elev={t.elev} live={t.running} />}
      {t.mode === "gps" && t.running && <ChestMap chests={chests.filter((c) => !c.claimed)} me={t.pos} />}
      {boom !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-destructive/80 backdrop-blur-sm" onClick={() => setBoom(null)}>
          <span className="animate-ping text-8xl">💥</span>
          <p className="mt-6 font-display text-5xl text-foreground">BOOM!</p>
          <p className="mt-2 px-8 text-center text-foreground">
            The speed bomb exploded{boom > 0 ? `: you lose ${boom} streak level(s)` : ""}.
          </p>
        </div>
      )}
    </AppShell>
  );
}
