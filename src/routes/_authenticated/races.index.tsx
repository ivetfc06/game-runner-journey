import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, useUser } from "@/lib/game";
import { useFriends } from "./friends";

export const Route = createFileRoute("/_authenticated/races/")({
  head: () => ({
    meta: [
      { title: "Retos — RunQuest" },
      { name: "description", content: "Reta a tus amigos en directo o a distancia y apuesta monedas." },
      { property: "og:title", content: "Retos — RunQuest" },
      { property: "og:description", content: "Reta a tus amigos en directo o a distancia y apuesta monedas." },
    ],
  }),
  component: RacesPage,
});

const STATUS: Record<string, string> = {
  pending: "Pendiente",
  active: "En curso",
  finished: "Terminado",
  cancelled: "Cancelado",
  expired: "Caducado",
};

function RacesPage() {
  const { data: user } = useUser();
  const { data: fl = [] } = useFriends();
  const friends = fl.filter((f) => f.status === "accepted" && f.other).map((f) => f.other);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [opp, setOpp] = useState("");
  const [mode, setMode] = useState<"async" | "live">("async");
  const [dist, setDist] = useState(5);
  const [hours, setHours] = useState(24);
  const [stake, setStake] = useState(0);

  const { data: races = [] } = useQuery({
    queryKey: ["races", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("races").select("*").order("created_at", { ascending: false }).limit(30);
      return data ?? [];
    },
  });
  const names = new Map(fl.filter((f) => f.other).map((f) => [f.other.id, f.other.display_name]));

  const create = async () => {
    if (!opp) { toast.error("Elige un amigo"); return; }
    const { data, error } = await supabase.rpc("create_race", {
      _opponent: opp, _mode: mode, _distance: dist, _stake: stake, _hours: hours,
    });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("¡Reto enviado!");
    qc.invalidateQueries();
    navigate({ to: "/races/$id", params: { id: data as string } });
  };

  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
      {children}
    </button>
  );

  return (
    <AppShell>
      <h2 className="font-display text-3xl tracking-wide text-foreground">Retos</h2>
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-xl text-foreground">Nuevo reto</h3>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">Añade amigos primero para poder retarlos.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {friends.map((f) => <Chip key={f.id} on={opp === f.id} onClick={() => setOpp(f.id)}>{f.display_name}</Chip>)}
            </div>
            <div className="flex gap-2">
              <Chip on={mode === "async"} onClick={() => setMode("async")}>A distancia</Chip>
              <Chip on={mode === "live"} onClick={() => setMode("live")}>En directo</Chip>
            </div>
            <div className="flex gap-2">
              {[1, 3, 5, 10].map((d) => <Chip key={d} on={dist === d} onClick={() => setDist(d)}>{d} km</Chip>)}
            </div>
            {mode === "async" && (
              <div className="flex gap-2">
                {[24, 48].map((h) => <Chip key={h} on={hours === h} onClick={() => setHours(h)}>{h} h</Chip>)}
              </div>
            )}
            <label className="text-sm text-muted-foreground">
              Apuesta en monedas (opcional; el ganador se lo lleva todo)
              <Input type="number" min={0} value={stake} onChange={(e) => setStake(Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <p className="text-xs text-muted-foreground">Premio al ganador: +100 monedas y +250 XP, además del bote.</p>
            <Button onClick={create} className="font-display text-lg">Enviar reto</Button>
          </>
        )}
      </section>
      <ul className="flex flex-col gap-2">
        {races.map((r) => {
          const other = r.creator === user?.id ? r.opponent : r.creator;
          return (
            <li key={r.id}>
              <Link to="/races/$id" params={{ id: r.id }} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
                <div>
                  <p className="font-semibold text-foreground">vs {names.get(other) ?? "Amigo"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.mode === "live" ? "En directo" : "A distancia"} · {Number(r.distance_km)} km · bote {r.stake * 2}
                  </p>
                </div>
                <span className={`text-xs font-bold ${r.winner === user?.id ? "text-primary" : "text-muted-foreground"}`}>
                  {r.status === "finished" ? (r.winner === user?.id ? "¡Ganaste!" : r.winner ? "Perdiste" : "Empate") : STATUS[r.status]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
