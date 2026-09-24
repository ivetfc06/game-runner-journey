import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, initials, levelOf, useUser } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({
    meta: [
      { title: "Friends — RunQuest" },
      { name: "description", content: "Add fellow runners and compete in the rankings." },
      { property: "og:title", content: "Friends — RunQuest" },
      { property: "og:description", content: "Add fellow runners and compete in the rankings." },
    ],
  }),
  component: FriendsPage,
});

type P = { id: string; username: string; display_name: string; xp: number; coins: number; total_km: number };

export function useFriends() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ["friends", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = await supabase.from("friendships").select("*");
      if (error) throw error;
      const ids = [...new Set((rows ?? []).flatMap((r) => [r.requester, r.addressee]))];
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,username,display_name,xp,coins,total_km").in("id", ids)
        : { data: [] as P[] };
      const byId = new Map((profs ?? []).map((p) => [p.id, p as P]));
      const me = user!.id;
      return (rows ?? []).map((r) => ({
        ...r,
        other: byId.get(r.requester === me ? r.addressee : r.requester)!,
        incoming: r.addressee === me,
      }));
    },
  });
}

function FriendsPage() {
  const { data: user } = useUser();
  const { data: list = [] } = useFriends();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<P[]>([]);
  const refresh = () => qc.invalidateQueries({ queryKey: ["friends"] });

  const search = async () => {
    if (q.trim().length < 2) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,username,display_name,xp,coins,total_km")
      .or(`username.ilike.%${q.trim()}%,display_name.ilike.%${q.trim()}%`)
      .neq("id", user!.id)
      .limit(10);
    setResults((data ?? []) as P[]);
  };
  const add = async (id: string) => {
    const { error } = await supabase.from("friendships").insert({ requester: user!.id, addressee: id });
    if (error) toast.error(error.code === "23505" ? "A request already exists" : errMsg(error));
    else toast.success("Request sent");
    refresh();
  };
  const accept = async (id: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    refresh();
  };
  const remove = async (id: string) => {
    await supabase.from("friendships").delete().eq("id", id);
    refresh();
  };

  const friends = list.filter((f) => f.status === "accepted" && f.other);
  const incoming = list.filter((f) => f.status === "pending" && f.incoming && f.other);
  const outgoing = list.filter((f) => f.status === "pending" && !f.incoming && f.other);
  const ranking = [...friends.map((f) => f.other)].sort((a, b) => b.xp - a.xp);

  const Row = ({ p, children }: { p: P; children?: React.ReactNode }) => (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary font-display text-foreground">
        {initials(p.display_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{p.display_name}</p>
        <p className="text-xs text-muted-foreground">
          @{p.username} · Level {levelOf(p.xp)} · {Number(p.total_km).toFixed(1)} km
        </p>
      </div>
      {children}
    </li>
  );

  return (
    <AppShell>
      <h2 className="font-display text-3xl tracking-wide text-foreground">Friends</h2>
      <div className="flex gap-2">
        <Input placeholder="Search by name or @username" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
        <Button onClick={search}>Search</Button>
      </div>
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((p) => (
            <Row key={p.id} p={p}>
              <Button size="sm" onClick={() => add(p.id)}>Add</Button>
            </Row>
          ))}
        </ul>
      )}
      {incoming.length > 0 && (
        <section>
          <h3 className="mb-2 font-display text-xl text-foreground">Requests</h3>
          <ul className="flex flex-col gap-2">
            {incoming.map((f) => (
              <Row key={f.id} p={f.other}>
                <Button size="sm" onClick={() => accept(f.id)}>Accept</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>✕</Button>
              </Row>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h3 className="mb-2 font-display text-xl text-foreground">Friends ranking</h3>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground">You do not have any friends yet. Find someone above!</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ranking.map((p, i) => (
              <Row key={p.id} p={p}>
                <span className="font-display text-2xl text-primary">#{i + 1}</span>
              </Row>
            ))}
          </ul>
        )}
      </section>
      {outgoing.length > 0 && (
        <section>
          <h3 className="mb-2 font-display text-xl text-foreground">Sent</h3>
          <ul className="flex flex-col gap-2">
            {outgoing.map((f) => (
              <Row key={f.id} p={f.other}>
                <span className="text-xs text-muted-foreground">Pending</span>
              </Row>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
