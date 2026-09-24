import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import ChestMap from "@/components/ChestMap";
import { RunPanel } from "@/components/RunPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAutoClaim, useChests } from "@/lib/chests";
import { errMsg, useRunTracker } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/run")({
  head: () => ({
    meta: [
      { title: "Correr — RunQuest" },
      { name: "description", content: "Carrera libre con GPS: gana XP, monedas y abre cofres por el camino." },
      { property: "og:title", content: "Correr — RunQuest" },
      { property: "og:description", content: "Carrera libre con GPS: gana XP, monedas y abre cofres por el camino." },
    ],
  }),
  component: RunPage,
});

function RunPage() {
  const t = useRunTracker();
  const qc = useQueryClient();
  const { data: chests = [] } = useChests();
  useAutoClaim(t.pos, t.running && t.mode === "gps");

  const finish = async () => {
    t.stop();
    if (t.km < 0.05) {
      toast("Carrera demasiado corta para puntuar");
      return;
    }
    const { data, error } = await supabase.rpc("finish_run", { _km: t.km, _seconds: t.seconds });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    const r = data as { xp: number; coins: number; freezes_used: number; boosted: boolean };
    toast.success(`¡Carrera completada! +${r.xp} XP${r.boosted ? " (x2)" : ""} · +${r.coins} monedas`);
    if (r.freezes_used > 0) toast(`🛡️ Usaste ${r.freezes_used} protector(es) y tu racha sigue viva`);
    qc.invalidateQueries({ queryKey: ["profile"] });
    t.reset();
  };

  return (
    <AppShell>
      <h2 className="font-display text-3xl tracking-wide text-foreground">Carrera libre</h2>
      <RunPanel t={t} onFinish={finish} />
      {t.mode === "gps" && t.running && <ChestMap chests={chests} me={t.pos} />}
    </AppShell>
  );
}
