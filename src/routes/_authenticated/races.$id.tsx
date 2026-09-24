import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RunPanel } from "@/components/RunPanel";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAutoClaim } from "@/lib/chests";
import { errMsg, formatTime, useRunTracker, useUser } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/races/$id")({
  head: () => ({
    meta: [
      { title: "Challenge — RunQuest" },
      { name: "description", content: "Challenge details and race against your friend." },
      { property: "og:title", content: "Challenge — RunQuest" },
      { property: "og:description", content: "Challenge details and race against your friend." },
    ],
  }),
  component: RacePage,
});

function RacePage() {
  const { id } = Route.useParams();
  const { data: user } = useUser();
  const qc = useQueryClient();
  const t = useRunTracker();
  useAutoClaim(t.pos, t.running && t.mode === "gps");

  const { data } = useQuery({
    queryKey: ["race", id],
    queryFn: async () => {
      await supabase.rpc("resolve_race", { _race: id });
      const { data: race } = await supabase.from("races").select("*").eq("id", id).single();
      const { data: prog } = await supabase.from("race_progress").select("*").eq("race_id", id);
      const { data: profs } = race
        ? await supabase.from("profiles").select("id,display_name").in("id", [race.creator, race.opponent])
        : { data: [] };
      return { race, prog: prog ?? [], names: new Map((profs ?? []).map((p) => [p.id, p.display_name])) };
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`race-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "race_progress", filter: `race_id=eq.${id}` }, () =>
        qc.invalidateQueries({ queryKey: ["race", id] }),
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "races", filter: `id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["race", id] });
        qc.invalidateQueries({ queryKey: ["profile"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, qc]);

  const race = data?.race;
  const target = Number(race?.distance_km ?? 0);
  const sent = useRef(0);

  // Push progress every ~50 m so the rival sees it live and finish when target reached
  useEffect(() => {
    if (!race || !t.running) return;
    const done = t.km >= target;
    if (!done && t.km - sent.current < 0.05) return;
    sent.current = t.km;
    if (done) t.stop();
    supabase
      .rpc("update_race_progress", { _race: id, _km: Math.min(t.km, target), _seconds: t.seconds })
      .then(({ error }) => {
        if (error) toast.error(errMsg(error));
        else if (done) toast.success("Distance complete!");
        qc.invalidateQueries({ queryKey: ["race", id] });
        qc.invalidateQueries({ queryKey: ["profile"] });
      });
  }, [t.km, t.running, race, target, id, t, qc]);

  if (!race) return <AppShell><p className="text-muted-foreground">Loading…</p></AppShell>;

  const me = user?.id;
  const mine = data!.prog.find((p) => p.user_id === me);
  const respond = async (accept: boolean) => {
    const { error } = await supabase.rpc("respond_race", { _race: id, _accept: accept });
    if (error) toast.error(errMsg(error));
    qc.invalidateQueries();
  };

  return (
    <AppShell>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {race.mode === "live" ? "Live race" : "Remote challenge"} · {target} km
        </p>
        <h2 className="font-display text-3xl text-foreground">
          {data!.names.get(race.creator)} vs {data!.names.get(race.opponent)}
        </h2>
        <p className="text-sm text-muted-foreground">
          Pot: {race.stake * 2} coins · Bonus: +100 coins and +250 XP
          {race.deadline && race.status !== "finished" && ` · Ends ${new Date(race.deadline).toLocaleString("en-GB")}`}
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        {[race.creator, race.opponent].map((uid) => {
          const p = data!.prog.find((x) => x.user_id === uid);
          const km = uid === me && t.running ? t.km : Number(p?.distance_km ?? 0);
          return (
            <div key={uid}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">{uid === me ? "You" : data!.names.get(uid)}</span>
                <span className="text-muted-foreground">
                  {p?.time_seconds ? `🏁 ${formatTime(p.time_seconds)}` : `${km.toFixed(2)} km`}
                </span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-secondary">
                <div className={`h-full rounded-full transition-all ${uid === me ? "bg-primary" : "bg-stamina"}`} style={{ width: `${Math.min(100, (km / target) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      {race.status === "pending" && (
        race.opponent === me ? (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => respond(true)}>Accept{race.stake ? ` (stake ${race.stake})` : ""}</Button>
            <Button variant="secondary" onClick={() => respond(false)}>Decline</Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Waiting for your friend to accept…</p>
            <Button variant="ghost" onClick={() => respond(false)}>Cancel</Button>
          </div>
        )
      )}

      {race.status === "active" && !mine?.finished_at && (
        <RunPanel t={t} target={target} onFinish={() => t.stop()} finishLabel="Pause" />
      )}
      {race.status === "active" && mine?.finished_at && (
        <p className="text-center text-sm text-muted-foreground">You have finished. Waiting for your friend…</p>
      )}
      {race.status === "finished" && (
        <p className="rounded-2xl bg-secondary p-4 text-center font-display text-2xl text-foreground">
          {race.winner === me ? `🏆 You won! +${race.stake * 2 + 100} coins` : race.winner ? "Your friend won this time" : "Draw · stakes returned"}
        </p>
      )}
      {(race.status === "cancelled" || race.status === "expired") && (
        <p className="text-center text-sm text-muted-foreground">Challenge {race.status === "expired" ? "expired" : "cancelled"}. Coins returned.</p>
      )}
    </AppShell>
  );
}
