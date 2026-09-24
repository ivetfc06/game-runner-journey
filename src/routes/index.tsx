import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Flame,
  Zap,
  MapPin,
  Trophy,
  Play,
  Pause,
  Footprints,
  Timer,
  Gauge,
  Star,
  Target,
  Medal,
  Coins,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RunQuest — Convierte tu carrera en un videojuego" },
      {
        name: "description",
        content:
          "Corre, gana XP, sube de nivel y completa misiones. RunQuest convierte cada carrera en una aventura.",
      },
      { property: "og:title", content: "RunQuest — Convierte tu carrera en un videojuego" },
      {
        property: "og:description",
        content:
          "Corre, gana XP, sube de nivel y completa misiones. RunQuest convierte cada carrera en una aventura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MISSIONS = [
  { id: 1, title: "Calentamiento épico", desc: "Corre 3 km sin parar", xp: 150, progress: 2.1, goal: 3, unit: "km" },
  { id: 2, title: "Cazador de amaneceres", desc: "Corre antes de las 8:00", xp: 200, progress: 0, goal: 1, unit: "sesión" },
  { id: 3, title: "Racha imparable", desc: "Corre 5 días seguidos", xp: 350, progress: 3, goal: 5, unit: "días" },
];

const ACHIEVEMENTS = [
  { icon: Medal, label: "Primera carrera", unlocked: true },
  { icon: Flame, label: "Racha x3", unlocked: true },
  { icon: Zap, label: "Sprint 400m", unlocked: true },
  { icon: Trophy, label: "10 km club", unlocked: false },
  { icon: Star, label: "Nivel 10", unlocked: false },
  { icon: Target, label: "100 km total", unlocked: false },
];

const TREASURES = [
  { at: 0.8, label: "Cofre de bronce", coins: 20, emoji: "🪙" },
  { at: 1.9, label: "Gema azul", coins: 50, emoji: "💎" },
  { at: 3.2, label: "Cofre de plata", coins: 40, emoji: "🎁" },
  { at: 4.4, label: "Cofre dorado", coins: 100, emoji: "👑" },
];

const FRIENDS = [
  { name: "Marc", initials: "MR", start: 0.6, speed: 0.04, type: "adelantas" as const },
  { name: "Laura", initials: "LG", start: 3.0, speed: -0.05, type: "cruzas" as const },
  { name: "Pau", initials: "PS", start: 2.4, speed: 0.05, type: "adelantas" as const },
];
const FRIEND_REWARD = { adelantas: 30, cruzas: 15 };

function Index() {
  const [running, setRunning] = useState(false);
  const [xp, setXp] = useState(1240);
  const [km, setKm] = useState(0);
  const [coins, setCoins] = useState(320);
  const [collected, setCollected] = useState<number[]>([]);
  const [met, setMet] = useState<string[]>([]);
  const [feed, setFeed] = useState<{ id: number; text: string; coins: number }[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const level = 7;
  const xpForNext = 2000;
  const xpPct = Math.min(100, Math.round((xp / xpForNext) * 100));

  const friendPos = (f: (typeof FRIENDS)[number], k: number) => f.start + f.speed * k * 10;

  const reward = (text: string, amount: number) => {
    setCoins((c) => c + amount);
    setFeed((f) => [{ id: Date.now() + Math.random(), text, coins: amount }, ...f].slice(0, 6));
    setToast(`${text} +${amount}`);
    setTimeout(() => setToast(null), 1500);
  };

  const toggleRun = () => {
    if (running) {
      setRunning(false);
      return;
    }
    setRunning(true);
    setCollected([]);
    setMet([]);
    const got = new Set<number>();
    const seen = new Set<string>();
    let k = 0;
    const interval = setInterval(() => {
      const prev = k;
      k = Math.round((k + 0.1) * 10) / 10;
      TREASURES.forEach((t, i) => {
        if (!got.has(i) && k >= t.at) {
          got.add(i);
          setCollected((c) => [...c, i]);
          reward(`${t.emoji} ${t.label}`, t.coins);
        }
      });
      FRIENDS.forEach((f) => {
        const before = friendPos(f, prev) - prev;
        const after = friendPos(f, k) - k;
        if (!seen.has(f.name) && before > 0 && after <= 0) {
          seen.add(f.name);
          setMet((m) => [...m, f.name]);
          reward(
            f.type === "adelantas" ? `⚡ Adelantas a ${f.name}` : `🤝 Te cruzas con ${f.name}`,
            FRIEND_REWARD[f.type],
          );
        }
      });
      setXp((v) => v + 10);
      if (k >= 5) {
        clearInterval(interval);
        setRunning(false);
        setXp((v) => v + 500);
      }
      setKm(k >= 5 ? 5 : k);
    }, 400);
  };

  const pct = (x: number) => `${Math.max(0, Math.min(100, (x / 5) * 100))}%`;

  return (
    <div className="min-h-screen bg-background bg-grid">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-accent/50 bg-card px-4 py-2 text-sm font-bold text-accent card-glow">
          {toast} 🪙
        </div>
      )}
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 pb-10 pt-6">
        {/* Header: jugador */}
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-2xl text-primary-foreground card-glow">
            IF
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Corredora
            </p>
            <h1 className="font-display text-xl leading-none text-foreground">Ivet Fernández</h1>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
            <Coins className="h-4 w-4 text-xp" />
            <span className="text-sm font-bold text-foreground">{coins}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
            <Flame className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-foreground">3</span>
          </div>
        </header>

        {/* Nivel y XP */}
        <section className="rounded-2xl border border-border bg-card p-5 card-glow">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Nivel
              </p>
              <p className="font-display text-6xl leading-none text-primary text-glow">{level}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-xp">{xp.toLocaleString("es-ES")}</span> /{" "}
                {xpForNext.toLocaleString("es-ES")} XP
              </p>
              <p className="text-[11px] text-muted-foreground">
                {Math.max(0, xpForNext - xp)} XP para el nivel {level + 1}
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-xp transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </section>

        {/* Pista en vivo */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl tracking-wide text-foreground">Tu ruta · 5 km</h2>
            <span className="text-xs text-muted-foreground">
              {collected.length}/{TREASURES.length} tesoros · {met.length}/{FRIENDS.length} amigos
            </span>
          </div>
          <div className="relative h-16">
            <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-secondary" />
            <div
              className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary transition-all"
              style={{ width: pct(km) }}
            />
            {TREASURES.map((t, i) => (
              <span
                key={t.label}
                className={`absolute top-0 -translate-x-1/2 text-lg transition-all ${
                  collected.includes(i) ? "scale-50 opacity-20" : "animate-bounce"
                }`}
                style={{ left: pct(t.at) }}
              >
                {t.emoji}
              </span>
            ))}
            {FRIENDS.map((f) => (
              <span
                key={f.name}
                className={`absolute bottom-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-[9px] font-bold transition-all ${
                  met.includes(f.name) ? "bg-accent text-accent-foreground" : "bg-stamina text-background"
                }`}
                style={{ left: pct(friendPos(f, km)) }}
                title={f.name}
              >
                {f.initials}
              </span>
            ))}
            <span
              className="absolute top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground card-glow transition-all"
              style={{ left: pct(km) }}
            >
              TÚ
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Coge tesoros 🎁 · Adelanta a un amigo: +{FRIEND_REWARD.adelantas} 🪙 · Crúzate con uno: +
            {FRIEND_REWARD.cruzas} 🪙
          </p>
          {feed.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {feed.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground"
                >
                  <span>{e.text}</span>
                  <span className="font-bold text-xp">+{e.coins} 🪙</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Botón de carrera */}
        <button
          onClick={toggleRun}
          className={`group relative flex flex-col items-center justify-center gap-1 rounded-3xl border py-8 transition-all ${
            running
              ? "border-destructive/50 bg-destructive/10"
              : "border-primary/40 bg-primary/10 card-glow"
          }`}
        >
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              running ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground animate-pulse-slow"
            }`}
          >
            {running ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
          </span>
          <span className="font-display text-2xl tracking-wide text-foreground">
            {running ? "Finalizar carrera" : "Iniciar carrera"}
          </span>
          {running && (
            <span className="text-sm font-semibold text-primary">{km.toFixed(1)} km · buscando tesoros…</span>
          )}
          {!running && (
            <span className="text-xs text-muted-foreground">Simulación: 5 km = +500 XP + monedas</span>
          )}
        </button>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { icon: Footprints, label: "Distancia", value: "48,2 km" },
            { icon: Timer, label: "Tiempo", value: "5h 12m" },
            { icon: Gauge, label: "Ritmo", value: "5'24\"" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3"
            >
              <Icon className="h-5 w-5 text-stamina" />
              <span className="font-display text-lg leading-none text-foreground">{value}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </section>

        {/* Misiones */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              Misiones activas
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
              {MISSIONS.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {MISSIONS.map((m) => {
              const pct = Math.min(100, Math.round((m.progress / m.goal) * 100));
              return (
                <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{m.title}</p>
                      <p className="text-sm text-muted-foreground">{m.desc}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-xp/15 px-2.5 py-1 text-xs font-bold text-xp">
                      <Zap className="h-3 w-3" /> +{m.xp}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {m.progress}/{m.goal} {m.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Logros */}
        <section>
          <h2 className="mb-3 font-display text-2xl tracking-wide text-foreground">Logros</h2>
          <div className="grid grid-cols-3 gap-3">
            {ACHIEVEMENTS.map(({ icon: Icon, label, unlocked }) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center ${
                  unlocked
                    ? "border-accent/40 bg-accent/10"
                    : "border-border bg-card opacity-40"
                }`}
              >
                <Icon className={`h-6 w-6 ${unlocked ? "text-accent" : "text-muted-foreground"}`} />
                <span className="text-[10px] font-semibold leading-tight text-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          RunQuest · Madrid
        </footer>
      </div>
    </div>
  );
}
