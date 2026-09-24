import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import ChestMap from "@/components/ChestMap";
import { RARITY_LABEL, useChests } from "@/lib/chests";
import { haversine, type Pos } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Mapa de cofres — RunQuest" },
      { name: "description", content: "Cofres del tesoro escondidos en parques y monumentos reales." },
      { property: "og:title", content: "Mapa de cofres — RunQuest" },
      { property: "og:description", content: "Cofres del tesoro escondidos en parques y monumentos reales." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: chests = [] } = useChests();
  const [me, setMe] = useState<Pos | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const sorted = [...chests].sort((a, b) => (me ? haversine(me, a) - haversine(me, b) : 0));

  return (
    <AppShell>
      <div>
        <h2 className="font-display text-3xl tracking-wide text-foreground">Cofres del tesoro</h2>
        <p className="text-sm text-muted-foreground">
          Corre hasta un cofre con una carrera GPS activa y se abrirá solo al llegar (a menos de 30 m). Cada cofre
          vuelve a estar disponible cada 24 h.
        </p>
      </div>
      <ChestMap chests={chests} me={me} />
      <ul className="flex flex-col gap-2">
        {sorted.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
            <div>
              <p className="font-semibold text-foreground">
                {c.claimed ? "✅" : "🎁"} {c.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {RARITY_LABEL[c.rarity]} · +{c.coins} monedas · +{c.xp} XP
                {me && ` · ${(haversine(me, c) / 1000).toFixed(1)} km`}
              </p>
            </div>
            {c.claimed && <span className="text-xs text-muted-foreground">Vuelve mañana</span>}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
