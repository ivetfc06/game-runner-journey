import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Footprints, Map, Play, Swords, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { levelOf, levelProgress, useIsAdmin, useProfile, XP_PER_LEVEL } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Tu HUD — RunQuest" },
      { name: "description", content: "Nivel, monedas, retos pendientes y cofres de tu corredor." },
      { property: "og:title", content: "Tu HUD — RunQuest" },
      { property: "og:description", content: "Nivel, monedas, retos pendientes y cofres de tu corredor." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: p } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: pending = 0 } = useQuery({
    queryKey: ["races-pending", p?.id],
    enabled: !!p,
    queryFn: async () => {
      const { count } = await supabase
        .from("races")
        .select("id", { count: "exact", head: true })
        .eq("opponent", p!.id)
        .eq("status", "pending");
      return count ?? 0;
    },
  });
  const xp = p?.xp ?? 0;
  const lvl = levelOf(xp);
  const prog = levelProgress(xp);

  return (
    <AppShell>
      <section className="rounded-2xl border border-border bg-card p-5 card-glow">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nivel</p>
            <p className="font-display text-6xl leading-none text-primary text-glow">{lvl}</p>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            <span className="font-bold text-xp">{prog}</span> / {XP_PER_LEVEL} XP
            <br />
            {XP_PER_LEVEL - prog} XP para el nivel {lvl + 1}
          </p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-xp transition-all" style={{ width: `${(prog / XP_PER_LEVEL) * 100}%` }} />
        </div>
      </section>

      <Link
        to="/run"
        className="flex flex-col items-center gap-1 rounded-3xl border border-primary/40 bg-primary/10 py-7 card-glow"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground animate-pulse-slow">
          <Play className="ml-1 h-7 w-7" />
        </span>
        <span className="font-display text-2xl tracking-wide text-foreground">Iniciar carrera</span>
        <span className="text-xs text-muted-foreground">1 km = +100 XP · +10 monedas</span>
      </Link>

      <section className="grid grid-cols-3 gap-3">
        {[
          { icon: Footprints, label: "Total km", value: Number(p?.total_km ?? 0).toFixed(1) },
          { icon: Zap, label: "XP total", value: xp.toLocaleString("es-ES") },
          { icon: Trophy, label: "Racha", value: `${p?.streak ?? 0} días` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3">
            <Icon className="h-5 w-5 text-stamina" />
            <span className="font-display text-lg leading-none text-foreground">{value}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/races" className="rounded-2xl border border-border bg-card p-4">
          <Swords className="h-6 w-6 text-accent" />
          <p className="mt-2 font-display text-xl text-foreground">Retos</p>
          <p className="text-xs text-muted-foreground">
            {pending > 0 ? `${pending} reto(s) esperando respuesta` : "Reta a un amigo"}
          </p>
        </Link>
        <Link to="/map" className="rounded-2xl border border-border bg-card p-4">
          <Map className="h-6 w-6 text-xp" />
          <p className="mt-2 font-display text-xl text-foreground">Cofres</p>
          <p className="text-xs text-muted-foreground">Busca tesoros en tu ciudad</p>
        </Link>
      </div>

      {isAdmin && (
        <Link to="/admin/chests" className="text-center text-sm font-semibold text-primary">
          Gestionar cofres (admin)
        </Link>
      )}
    </AppShell>
  );
}
