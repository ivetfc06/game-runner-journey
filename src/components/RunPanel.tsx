import { Pause, Play, Satellite } from "lucide-react";
import { formatPace, formatTime, type useRunTracker } from "@/lib/game";

type Tracker = ReturnType<typeof useRunTracker>;

export function RunPanel({
  t,
  onFinish,
  target,
  finishLabel = "Finish run",
}: {
  t: Tracker;
  onFinish: () => void;
  target?: number;
  finishLabel?: string;
}) {
  const pct = target ? Math.min(100, (t.km / target) * 100) : null;
  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Distance", value: `${t.km.toFixed(2)} km` },
          { label: "Time", value: formatTime(t.seconds) },
          { label: "Pace", value: formatPace(t.km, t.seconds) },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center rounded-2xl border border-border bg-card p-3">
            <span className="font-display text-xl text-foreground">{s.value}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
      {pct !== null && (
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {t.gpsError && <p className="rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{t.gpsError}</p>}
      {t.running ? (
        <button
          onClick={onFinish}
          className="flex flex-col items-center gap-1 rounded-3xl border border-destructive/50 bg-destructive/10 py-6"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            <Pause className="h-6 w-6" />
          </span>
          <span className="font-display text-2xl text-foreground">{finishLabel}</span>
          <span className="text-xs text-muted-foreground">
            GPS active · keep the app open
          </span>
        </button>
      ) : (
        <button
            onClick={() => t.start()}
            className="flex flex-col items-center gap-1 rounded-3xl border border-primary/40 bg-primary/10 py-6 card-glow"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Satellite className="h-6 w-6" />
            </span>
            <span className="font-display text-xl text-foreground">Run with GPS</span>
          </button>
      )}
      {!t.running && (
        <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
          <Play className="h-3 w-3" /> Real-world chests only open while running with GPS.
        </p>
      )}
    </section>
  );
}
