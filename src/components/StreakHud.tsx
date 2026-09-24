import { Bomb, Mountain, Route as RouteIcon, Zap } from "lucide-react";
import { formatPace } from "@/lib/game";

type P = {
  dist_streak: number;
  dist_target: number;
  elev_streak: number;
  elev_target: number;
  speed_streak: number;
  speed_target_km: number;
  speed_target_pace: number;
};

const paceTxt = (s: number) => formatPace(1, s);

/** Three streaks with live progress. Pass km/seconds/elev during a run. */
export function StreakHud({ p, km = 0, seconds = 0, elev = 0, live = false }: { p: P; km?: number; seconds?: number; elev?: number; live?: boolean }) {
  const dT = Number(p.dist_target);
  const sKm = Number(p.speed_target_km);
  const pace = km > 0 ? seconds / km : 0;
  const hot = live && km >= 0.2 && pace > p.speed_target_pace;
  const rows = [
    { icon: RouteIcon, name: "Distancia", streak: p.dist_streak, goal: `${dT.toFixed(1)} km`, pct: (km / dT) * 100, color: "bg-primary", tone: "text-primary" },
    { icon: Mountain, name: "Altura", streak: p.elev_streak, goal: `+${p.elev_target} m`, pct: (elev / p.elev_target) * 100, color: "bg-xp", tone: "text-xp" },
  ];
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <h3 className="font-display text-xl tracking-wide text-foreground">Rachas</h3>
      {rows.map((r) => (
        <div key={r.name}>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <r.icon className={`h-4 w-4 ${r.tone}`} /> {r.name} · <span className={r.tone}>x{r.streak}</span>
            </span>
            <span className="text-xs text-muted-foreground">Objetivo {r.goal}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
            <div className={`h-full rounded-full ${r.color} transition-all`} style={{ width: `${Math.min(100, r.pct)}%` }} />
          </div>
        </div>
      ))}
      <div className={`rounded-xl border p-2 ${hot ? "animate-pulse border-destructive bg-destructive/15" : "border-accent/40 bg-accent/10"}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            {hot ? <Bomb className="h-4 w-4 text-destructive" /> : <Zap className="h-4 w-4 text-accent" />} Velocidad ·{" "}
            <span className={hot ? "text-destructive" : "text-accent"}>x{p.speed_streak}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {sKm} km a {paceTxt(p.speed_target_pace)}/km
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
          <div className={`h-full rounded-full ${hot ? "bg-destructive" : "bg-accent"} transition-all`} style={{ width: `${Math.min(100, (km / sKm) * 100)}%` }} />
        </div>
        {live && (
          <p className={`mt-1 text-xs ${hot ? "font-bold text-destructive" : "text-muted-foreground"}`}>
            {hot ? `💣 ¡La bomba se calienta! Vas a ${paceTxt(pace)}/km, acelera` : km >= 0.2 ? "⚡ Buen ritmo, sigue así" : "La bomba se activa si vas lento o no llegas"}
          </p>
        )}
        {!live && <p className="mt-1 text-[11px] text-muted-foreground">Si estalla 💣 pierdes el 25% de los niveles, no todo.</p>}
      </div>
    </section>
  );
}
