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
      { title: "Gestión de cofres — RunQuest" },
      { name: "description", content: "Añade o quita cofres del tesoro en lugares reales." },
      { property: "og:title", content: "Gestión de cofres — RunQuest" },
      { property: "og:description", content: "Añade o quita cofres del tesoro en lugares reales." },
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

  if (isLoading) return <AppShell><p className="text-muted-foreground">Cargando…</p></AppShell>;
  if (!isAdmin) return <AppShell><p className="text-muted-foreground">Solo los administradores pueden gestionar cofres.</p></AppShell>;

  const add = async () => {
    if (!name || !pt) return toast.error("Pon un nombre y toca el mapa");
    const [coins, xp] = REWARD[rarity];
    const { error } = await supabase.from("chests").insert({ name, lat: pt.lat, lng: pt.lng, rarity, coins, xp });
    if (error) return toast.error(errMsg(error));
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
      <h2 className="font-display text-3xl text-foreground">Gestión de cofres</h2>
      <p className="text-sm text-muted-foreground">Toca el mapa para colocar un cofre nuevo.</p>
      <ChestMap chests={pt ? [...chests, { id: "new", name: "Nuevo", ...pt, rarity }] : chests} onPick={(lat, lng) => setPt({ lat, lng })} />
      <Input placeholder="Nombre del lugar" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex gap-2">
        {(Object.keys(REWARD) as (keyof typeof REWARD)[]).map((r) => (
          <Button key={r} size="sm" variant={rarity === r ? "default" : "secondary"} onClick={() => setRarity(r)}>
            {RARITY_LABEL[r]}
          </Button>
        ))}
      </div>
      <Button onClick={add}>Añadir cofre</Button>
      <ul className="flex flex-col gap-2">
        {chests.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
            <span className="text-sm text-foreground">{c.name} · {RARITY_LABEL[c.rarity]}</span>
            <Button size="sm" variant="ghost" onClick={() => del(c.id)}>Quitar</Button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
