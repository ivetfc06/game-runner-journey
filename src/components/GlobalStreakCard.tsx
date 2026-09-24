import { Link } from "@tanstack/react-router";
import { Bomb, CalendarCheck, Mountain, Route as RouteIcon } from "lucide-react";
import { globalStreak, RUNS_PER_WEEK, weekly } from "@/lib/runner";

type P = Parameters<typeof globalStreak>[0];

export function GlobalStreakCard({ p, link = true }: { p: P; link?: boolean }) {
  const g = globalStreak(p);
  const w = weekly(p);
  const frac = g - Math.floor(g);
  const R = 52;
  const C = 2 * Math.PI * R;
  const parts = [
    { icon: RouteIcon, label: "Distancia", v: p.dist_streak, tone: "text-primary" },
    { icon: Mountain, label: "Altura", v: p.elev_streak, tone: "text-xp" },
    { icon: Bomb, label: "Velocidad", v: p.speed_streak, tone: "text-accent" },
    { icon: CalendarCheck, label: "Consistencia", v: w.streak, tone: "text-accent" },
  ];
  const body = (
    <section className="flex items-center gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-4 card-glow">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" className="stroke-secondary" />
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
            className="stroke-primary transition-all duration-700"
            strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl leading-none text-primary text-glow">x{g.toFixed(1)}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Racha global</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {parts.map((x) => (
          <div key={x.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground"><x.icon className={`h-3.5 w-3.5 ${x.tone}`} />{x.label}</span>
            <span className={`font-display text-lg leading-none ${x.tone}`}>{x.v}</span>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground">
          {w.done ? "✅ Semana cumplida" : `${Math.min(w.runs, RUNS_PER_WEEK)}/${RUNS_PER_WEEK} carreras esta semana`} · anillo: progreso al siguiente nivel
        </p>
      </div>
    </section>
  );
  return link ? <Link to="/profile">{body}</Link> : body;
}
