import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RARITY_LABEL, useInventory } from "@/lib/chests";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Treasure chests — RunQuest" },
      { name: "description", content: "Your inventory of treasure chests collected while running." },
      { property: "og:title", content: "Treasure chests — RunQuest" },
      { property: "og:description", content: "Your inventory of treasure chests collected while running." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: inv = [] } = useInventory();

  return (
    <AppShell>
      <div>
        <h2 className="font-display text-3xl tracking-wide text-foreground">Treasure chests</h2>
        <p className="text-sm text-muted-foreground">
          Chests only appear on the map while you run with GPS active. Get within 35 m and it will be collected automatically.
        </p>
      </div>
      <Link
        to="/run"
        className="block rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center font-display text-xl tracking-wide text-primary"
      >
        🏃 Start a run to find chests
      </Link>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-xl tracking-wide text-foreground">🎒 Inventory ({inv.length})</h3>
        {inv.length === 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            You have not collected any chests yet. Go for a run and find your first one!
          </p>
        )}
        <ul className="mt-2 flex flex-col gap-2">
          {inv.map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded-xl bg-secondary/40 p-2 text-sm">
              <span className="text-foreground">🎁 {i.chests?.name}</span>
              <span className="text-xs text-muted-foreground">
                {RARITY_LABEL[i.chests?.rarity ?? ""]} · {new Date(i.claimed_at).toLocaleDateString("en-GB")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
