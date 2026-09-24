import { Link } from "@tanstack/react-router";
import { CalendarCheck, Trophy } from "lucide-react";
import { globalStreak, RUNS_PER_WEEK, weekly } from "@/lib/runner";

type P = Parameters<typeof globalStreak>[0] & Parameters<typeof weekly>[0];

export function GlobalStreakCard({ p, link = true }: { p: P; link?: boolean }) {
  const g = globalStreak(p);
  const w = weekly(p);
  const body = (
    <section className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 card-glow">
        <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-primary" /> Racha global
        </p>
        <p className="font-display text-5xl leading-none text-primary text-glow">x{g.toFixed(1)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Media de distancia, altura y velocidad</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <CalendarCheck className="h-3.5 w-3.5 text-accent" /> Consistencia
        </p>
        <p className="font-display text-5xl leading-none text-accent">{w.streak} sem</p>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: RUNS_PER_WEEK }).map((_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < w.runs ? "bg-accent" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {w.done ? "✅ Semana cumplida" : `${Math.min(w.runs, RUNS_PER_WEEK)}/${RUNS_PER_WEEK} carreras esta semana`}
        </p>
      </div>
    </section>
  );
  return link ? <Link to="/profile">{body}</Link> : body;
}
