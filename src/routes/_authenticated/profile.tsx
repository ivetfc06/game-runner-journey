import { createFileRoute } from "@tanstack/react-router";
import { Bomb, CalendarCheck, Mountain, Route as RouteIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GlobalStreakCard } from "@/components/GlobalStreakCard";
import { formatPace, levelOf, useProfile } from "@/lib/game";
import { RUNS_PER_WEEK, weekly } from "@/lib/runner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My runner profile — RunQuest" },
      { name: "description", content: "Your global streak, distance, elevation, speed, and weekly consistency levels." },
      { property: "og:title", content: "My runner profile — RunQuest" },
      { property: "og:description", content: "Global streak, individual levels, and weekly consistency." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: p } = useProfile();
  if (!p) return <AppShell><p className="text-muted-foreground">Loading…</p></AppShell>;
  const w = weekly(p);
  const lvl = levelOf(p.xp);
  const pillars = [
    { icon: RouteIcon, name: "Distance", lvl: p.dist_streak, tone: "text-primary", stats: [["Current goal", `${Number(p.dist_target).toFixed(1)} km`], ["Total km", `${Number(p.total_km).toFixed(1)} km`]] },
    { icon: Mountain, name: "Elevation", lvl: p.elev_streak, tone: "text-xp", stats: [["Current goal", `+${p.elev_target} m`], ["Increase per level", "+25 m"]] },
    { icon: Bomb, name: "Speed (Bomb)", lvl: p.speed_streak, tone: "text-accent", stats: [["Current goal", `${p.speed_target_km} km a ${formatPace(1, p.speed_target_pace)}/km`], ["If it explodes", "−25% of levels"]] },
    { icon: CalendarCheck, name: "Consistency", lvl: w.streak, tone: "text-accent", stats: [["This week", `${Math.min(w.runs, RUNS_PER_WEEK)}/${RUNS_PER_WEEK} runs`], ["Best streak", `${w.best} wks`]] },
  ];
  const max = Math.max(1, ...pillars.map((x) => x.lvl));
  return (
    <AppShell>
      <h2 className="font-display text-3xl tracking-wide text-foreground">Runner profile</h2>
      <GlobalStreakCard p={p} link={false} />
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-xl tracking-wide text-foreground">The 4 areas of your streak</h3>
        {pillars.map((x) => (
          <div key={x.name} className="rounded-xl bg-secondary/50 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-foreground"><x.icon className={`h-4 w-4 ${x.tone}`} />{x.name}</span>
              <span className={`font-display text-2xl ${x.tone}`}>Lvl {x.lvl}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(x.lvl / max) * 100}%` }} />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {x.stats.map(([k, v]) => (<div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold text-foreground">{v}</dd></div>))}
            </dl>
          </div>
        ))}
      </section>
      <section className="grid grid-cols-3 gap-2 text-center">
        {[["Level", lvl], ["Best streak wksanal", `${w.best} wks`], ["Rank", w.tier]].map(([k, v]) => (
          <div key={String(k)} className="rounded-xl border border-border bg-card p-3">
            <p className="font-display text-2xl text-foreground">{v}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
          </div>
        ))}
      </section>
      <p className="text-xs text-muted-foreground">Consistency: corre {3} veces en una wksana (lunes a domingo) para sumar una wksana. Si fallas una wksana, vuelve a empezar. Premio al cumplir: monedas y XP que crecen con la racha.</p>
    </AppShell>
  );
}
