import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RARITY_LABEL, useInventory } from "@/lib/chests";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Cofres del tesoro — RunQuest" },
      { name: "description", content: "Tu inventario de cofres del tesoro recogidos corriendo." },
      { property: "og:title", content: "Cofres del tesoro — RunQuest" },
      { property: "og:description", content: "Tu inventario de cofres del tesoro recogidos corriendo." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: inv = [] } = useInventory();

  return (
    <AppShell>
      <div>
        <h2 className="font-display text-3xl tracking-wide text-foreground">Cofres del tesoro</h2>
        <p className="text-sm text-muted-foreground">
          Los cofres solo aparecen en el mapa mientras corres con el GPS activado. Acércate a menos de 35 m de uno y se recogerá solo.
        </p>
      </div>
      <Link
        to="/run"
        className="block rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center font-display text-xl tracking-wide text-primary"
      >
        🏃 Iniciar carrera para buscar cofres
      </Link>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-xl tracking-wide text-foreground">🎒 Inventario ({inv.length})</h3>
        {inv.length === 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Aún no has recogido ningún cofre. ¡Sal a correr y encuentra el primero!
          </p>
        )}
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
