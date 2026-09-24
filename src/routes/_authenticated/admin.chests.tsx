import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import ChestMap from "@/components/ChestMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { RARITY_LABEL, useChests } from "@/lib/chests";
import { errMsg, useIsAdmin } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/admin/chests")({
  head: () => ({
    meta: [
      { title: "Chest management — RunQuest" },
      { name: "description", content: "Add or remove treasure chests in real-world locations." },
      { property: "og:title", content: "Chest management — RunQuest" },
      { property: "og:description", content: "Add or remove treasure chests in real-world locations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminChests,
});

const REWARD = { bronze: [40, 80], silver: [80, 150], gold: [150, 300] } as const;

function AdminChests() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { data: chests = [] } = useChests();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [pt, setPt] = useState<{ lat: number; lng: number } | null>(null);
  const [rarity, setRarity] = useState<keyof typeof REWARD>("bronze");

  if (isLoading) return <AppShell><p className="text-muted-foreground">Loading…</p></AppShell>;
  if (!isAdmin) return <AppShell><p className="text-muted-foreground">Only administrators can manage chests.</p></AppShell>;

  const add = async () => {
    if (!name || !pt) { toast.error("Enter a name and tap the map"); return; }
    const [coins, xp] = REWARD[rarity];
    const { error } = await supabase.from("chests").insert({ name, lat: pt.lat, lng: pt.lng, rarity, coins, xp });
    if (error) { toast.error(errMsg(error)); return; }
    setName("");
    setPt(null);
    qc.invalidateQueries({ queryKey: ["chests"] });
  };
  const del = async (id: string) => {
    await supabase.from("chests").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["chests"] });
  };

  return (
    <AppShell>
      <h2 className="font-display text-3xl text-foreground">Chest management</h2>
      <p className="text-sm text-muted-foreground">Tap the map to place a new chest.</p>
      <ChestMap chests={pt ? [...chests, { id: "new", name: "New", ...pt, rarity }] : chests} onPick={(lat, lng) => setPt({ lat, lng })} />
      <Input placeholder="Place name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex gap-2">
        {(Object.keys(REWARD) as (keyof typeof REWARD)[]).map((r) => (
          <Button key={r} size="sm" variant={rarity === r ? "default" : "secondary"} onClick={() => setRarity(r)}>
            {RARITY_LABEL[r]}
          </Button>
        ))}
      </div>
      <Button onClick={add}>Add chest</Button>
      <ul className="flex flex-col gap-2">
        {chests.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
            <span className="text-sm text-foreground">{c.name} · {RARITY_LABEL[c.rarity]}</span>
            <Button size="sm" variant="ghost" onClick={() => del(c.id)}>Remove</Button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
