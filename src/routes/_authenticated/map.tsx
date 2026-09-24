import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import ChestMap from "@/components/ChestMap";
import { RARITY_LABEL, useAutoClaim, useChests, useInventory } from "@/lib/chests";
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
  const { data: inv = [] } = useInventory();
  const [me, setMe] = useState<Pos | null>(null);
  useAutoClaim(me, true);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const visible = chests.filter((c) => !c.claimed);
  const sorted = [...visible].sort((a, b) => (me ? haversine(me, a) - haversine(me, b) : 0));

  return (
    <AppShell>
      <div>
        <h2 className="font-display text-3xl tracking-wide text-foreground">Cofres del tesoro</h2>
        <p className="text-sm text-muted-foreground">
          Tu posición se sigue en directo. Acércate a menos de 35 m de un cofre y se recogerá solo: pasa a tu inventario y desaparece del mapa durante 24 h.
        </p>
      </div>
      <ChestMap chests={visible} me={me} />
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
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-xl tracking-wide text-foreground">🎒 Inventario ({inv.length})</h3>
        {inv.length === 0 && <p className="text-sm text-muted-foreground">Aún no has recogido ningún cofre.</p>}
        <ul className="mt-2 flex flex-col gap-2">
          {inv.map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded-xl bg-secondary/40 p-2 text-sm">
              <span className="text-foreground">🎁 {i.chests?.name}</span>
              <span className="text-xs text-muted-foreground">
                {RARITY_LABEL[i.chests?.rarity ?? ""]} · {new Date(i.claimed_at).toLocaleDateString("es-ES")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
