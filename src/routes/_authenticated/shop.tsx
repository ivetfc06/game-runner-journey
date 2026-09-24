import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Coins, Shield, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, useProfile } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/shop")({
  head: () => ({
    meta: [
      { title: "Tienda — RunQuest" },
      { name: "description", content: "Canjea tus monedas por protectores de racha y potenciadores de XP." },
      { property: "og:title", content: "Tienda — RunQuest" },
      { property: "og:description", content: "Canjea tus monedas por protectores de racha y potenciadores de XP." },
    ],
  }),
  component: ShopPage,
});

const ITEMS = [
  {
    id: "streak_freeze",
    name: "Protector de racha",
    desc: "Si un día no corres, se gasta solo y tu racha no se pierde.",
    price: 150,
    icon: Shield,
    owned: (p: { streak_freezes: number }) => p.streak_freezes,
  },
  {
    id: "xp_boost",
    name: "Doble XP",
    desc: "Tu próxima carrera (de 0,5 km o más) da el doble de XP.",
    price: 100,
    icon: Zap,
    owned: (p: { xp_boost_runs: number }) => p.xp_boost_runs,
  },
] as const;

function ShopPage() {
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const buy = async (id: string, name: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("buy_item", { _item: id });
    setBusy(null);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success(`¡Has comprado ${name}!`);
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <AppShell>
      <div>
        <h2 className="font-display text-3xl tracking-wide text-foreground">Tienda</h2>
        <p className="text-sm text-muted-foreground">Canjea las monedas que ganas corriendo, abriendo cofres y ganando retos.</p>
      </div>
      <div className="flex flex-col gap-3">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const canAfford = (p?.coins ?? 0) >= it.price;
          return (
            <div key={it.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15">
                <Icon className="h-7 w-7 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl text-foreground">{it.name}</p>
                <p className="text-xs text-muted-foreground">{it.desc}</p>
                <p className="mt-1 text-xs font-semibold text-foreground">Tienes: {p ? it.owned(p) : 0}</p>
              </div>
              <Button disabled={!canAfford || busy === it.id} onClick={() => buy(it.id, it.name)} className="gap-1">
                <Coins className="h-4 w-4" /> {it.price}
              </Button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
