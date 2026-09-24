import { createFileRoute } from "@tanstack/react-router";
import { Bomb, Mountain, Route as RouteIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GlobalStreakCard } from "@/components/GlobalStreakCard";
import { formatPace, levelOf, useProfile } from "@/lib/game";
import { weekly } from "@/lib/runner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Mi perfil de corredor — RunQuest" },
      { name: "description", content: "Tu racha global, niveles de distancia, montaña y velocidad y tu consistencia semanal." },
      { property: "og:title", content: "Mi perfil de corredor — RunQuest" },
      { property: "og:description", content: "Racha global, niveles por pilar y consistencia semanal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: p } = useProfile();
  if (!p) return <AppShell><p className="text-muted-foreground">Cargando…</p></AppShell>;
  const w = weekly(p);
  const lvl = levelOf(p.xp);
  const pillars = [
    { icon: RouteIcon, name: "Distancia", lvl: p.dist_streak, tone: "text-primary", stats: [["Objetivo actual", `${Number(p.dist_target).toFixed(1)} km`], ["Km totales", `${Number(p.total_km).toFixed(1)} km`]] },
    { icon: Mountain, name: "Montaña", lvl: p.elev_streak, tone: "text-xp", stats: [["Objetivo actual", `+${p.elev_target} m`], ["Sube por nivel", "+25 m"]] },
    { icon: Bomb, name: "Velocidad (Bomba)", lvl: p.speed_streak, tone: "text-accent", stats: [["Objetivo actual", `${p.speed_target_km} km a ${formatPace(1, p.speed_target_pace)}/km`], ["Si estalla", "−25% de niveles"]] },
  ];
  const max = Math.max(1, ...pillars.map((x) => x.lvl));
  return (
    <AppShell>
      <h2 className="font-display text-3xl tracking-wide text-foreground">Perfil de corredor</h2>
      <GlobalStreakCard p={p} link={false} />
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-xl tracking-wide text-foreground">Niveles por pilar</h3>
        {pillars.map((x) => (
          <div key={x.name} className="rounded-xl bg-secondary/50 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-foreground"><x.icon className={`h-4 w-4 ${x.tone}`} />{x.name}</span>
              <span className={`font-display text-2xl ${x.tone}`}>Nv {x.lvl}</span>
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
        {[["Nivel", lvl.level], ["Mejor racha semanal", `${w.best} sem`], ["Rango", w.tier]].map(([k, v]) => (
          <div key={String(k)} className="rounded-xl border border-border bg-card p-3">
            <p className="font-display text-2xl text-foreground">{v}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
          </div>
        ))}
      </section>
      <p className="text-xs text-muted-foreground">Consistencia: corre {3} veces en una semana (lunes a domingo) para sumar una semana. Si fallas una semana, vuelve a empezar. Premio al cumplir: monedas y XP que crecen con la racha.</p>
    </AppShell>
  );
}
