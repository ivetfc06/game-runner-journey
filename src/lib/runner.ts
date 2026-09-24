type P = {
  dist_streak: number;
  elev_streak: number;
  speed_streak: number;
  week_runs?: number;
  week_key?: string | null;
  weekly_streak?: number;
  best_weekly_streak?: number;
  last_done_week?: string | null;
};

/** Racha global = media de los cuatro ámbitos (distancia, altura, velocidad y consistencia). */
export const globalStreak = (p: P) => (p.dist_streak + p.elev_streak + p.speed_streak + weekly(p).streak) / 4;

export const RUNS_PER_WEEK = 3;

const weekStart = (d = new Date()) => {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (x.getUTCDay() + 6) % 7; // lunes = 0
  x.setUTCDate(x.getUTCDate() - day);
  return x.toISOString().slice(0, 10);
};

/** Estado de consistencia semanal visto por el usuario. */
export function weekly(p: P) {
  const wk = weekStart();
  const prev = new Date(wk);
  prev.setUTCDate(prev.getUTCDate() - 7);
  const prevWk = prev.toISOString().slice(0, 10);
  const runs = p.week_key === wk ? (p.week_runs ?? 0) : 0;
  const alive = p.last_done_week === wk || p.last_done_week === prevWk;
  const streak = alive ? (p.weekly_streak ?? 0) : 0;
  const tier = streak >= 8 ? "Unstoppable" : streak >= 4 ? "Consistent" : streak >= 2 ? "Regular" : streak >= 1 ? "On the move" : "Not started";
  return { runs, streak, best: p.best_weekly_streak ?? 0, done: p.last_done_week === wk, tier };
}
