import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Footprints, Gift, Map, Play, Route as RouteIcon, Sunrise, Swords, Target, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { StreakHud } from "@/components/StreakHud";
import { GlobalStreakCard } from "@/components/GlobalStreakCard";
import { levelOf, levelProgress, useIsAdmin, useMissions, useProfile, XP_PER_LEVEL } from "@/lib/game";

const MISSION_ICON: Record<string, typeof Sunrise> = {
  "early-bird": Sunrise,
  "first-km": Footprints,
  "five-k": RouteIcon,
  hunter: Gift,
};

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your HUD — RunQuest" },
      { name: "description", content: "Your runner level, coins, pending challenges, and treasure chests." },
      { property: "og:title", content: "Your HUD — RunQuest" },
      { property: "og:description", content: "Your runner level, coins, pending challenges, and treasure chests." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: p } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: missions } = useMissions();
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
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Level</p>
            <p className="font-display text-6xl leading-none text-primary text-glow">{lvl}</p>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            <span className="font-bold text-xp">{prog}</span> / {XP_PER_LEVEL} XP
            <br />
            {XP_PER_LEVEL - prog} XP to level {lvl + 1}
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
        <span className="font-display text-2xl tracking-wide text-foreground">Start run</span>
        <span className="text-xs text-muted-foreground">1 km = +100 XP · +10 coins</span>
      </Link>

      <section className="grid grid-cols-3 gap-3">
        {[
          { icon: Footprints, label: "Total km", value: Number(p?.total_km ?? 0).toFixed(1) },
          { icon: Zap, label: "Total XP", value: xp.toLocaleString("en-GB") },
          { icon: Trophy, label: "Streak", value: `${p?.streak ?? 0} days` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3">
            <Icon className="h-5 w-5 text-stamina" />
            <span className="font-display text-lg leading-none text-foreground">{value}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
          </div>
        ))}
      </section>

      {p && <GlobalStreakCard p={p} />}
      {p && <StreakHud p={p} />}

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-display text-xl tracking-wide text-foreground">Today's quests</h3>
        </div>
        <div className="flex flex-col gap-2">
          {(missions ?? []).map((m) => {
            const Icon = MISSION_ICON[m.id] ?? Target;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  m.done ? "border-xp/40 bg-xp/10" : "border-border bg-secondary/40"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    m.done ? "bg-xp text-background" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {m.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${m.done ? "text-xp line-through" : "text-foreground"}`}>
                    {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-xp">+{m.xp_reward} XP</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/races" className="rounded-2xl border border-border bg-card p-4">
          <Swords className="h-6 w-6 text-accent" />
          <p className="mt-2 font-display text-xl text-foreground">Challenges</p>
          <p className="text-xs text-muted-foreground">
            {pending > 0 ? `${pending} challenge(s) awaiting your response` : "Challenge a friend"}
          </p>
        </Link>
        <Link to="/map" className="rounded-2xl border border-border bg-card p-4">
          <Map className="h-6 w-6 text-xp" />
          <p className="mt-2 font-display text-xl text-foreground">Chests</p>
          <p className="text-xs text-muted-foreground">Find treasure in your city</p>
        </Link>
      </div>

      {isAdmin && (
        <Link to="/admin/chests" className="text-center text-sm font-semibold text-primary">
          Manage chests (admin)
        </Link>
      )}
    </AppShell>
  );
}
