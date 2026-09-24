import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Coins, Gift, Magnet, Shield, Sparkles, Zap } from "lucide-react";
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

type P = { streak_freezes: number; xp_boost_runs: number; coin_boost_runs?: number; magnet_runs?: number };

const ITEMS: { id: string; name: string; desc: string; price: number; icon: typeof Coins; owned: ((p: P) => number) | null }[] = [
  {
    id: "streak_freeze",
    name: "Protector de racha",
    desc: "Si un día no corres, se gasta solo y tu racha no se pierde.",
    price: 150,
    icon: Shield,
    owned: (p: P) => p.streak_freezes,
  },
  {
    id: "xp_boost",
    name: "Doble XP",
    desc: "Tu próxima carrera (de 0,5 km o más) da el doble de XP.",
    price: 100,
    icon: Zap,
    owned: (p: P) => p.xp_boost_runs,
  },
  {
    id: "coin_boost",
    name: "Monedas x2",
    desc: "Tu próxima carrera (de 0,5 km o más) da el doble de monedas.",
    price: 120,
    icon: Coins,
    owned: (p: P) => p.coin_boost_runs ?? 0,
  },
  {
    id: "magnet",
    name: "Imán de cofres",
    desc: "Durante tu próxima carrera recoges cofres a 85 m en vez de 35 m.",
    price: 90,
    icon: Magnet,
    owned: (p: P) => p.magnet_runs ?? 0,
  },
  {
    id: "mystery_box",
    name: "Caja misteriosa",
    desc: "Premio sorpresa al instante: de 20 a 300 monedas y hasta 200 XP.",
    price: 80,
    icon: Gift,
    owned: null,
  },
  {
    id: "xp_pack",
    name: "Pack de XP",
    desc: "Sube de nivel más rápido: +500 XP al instante.",
    price: 200,
    icon: Sparkles,
    owned: null,
  },
];

function ShopPage() {
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const buy = async (id: string, name: string) => {
    setBusy(id);
    const { data, error } = await supabase.rpc("buy_item", { _item: id });
    setBusy(null);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    const r = data as { coins?: number; xp?: number } | null;
    if (id === "mystery_box" && r) toast.success(`🎁 Caja misteriosa: +${r.coins} monedas${r.xp ? ` · +${r.xp} XP` : ""}`);
    else toast.success(`¡Has comprado ${name}!`);
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
                {it.owned && <p className="mt-1 text-xs font-semibold text-foreground">Tienes: {p ? it.owned(p as unknown as P) : 0}</p>}
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
