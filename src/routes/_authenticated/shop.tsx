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
      { title: "Shop — RunQuest" },
      { name: "description", content: "Spend your coins on streak freezes and XP boosts." },
      { property: "og:title", content: "Shop — RunQuest" },
      { property: "og:description", content: "Spend your coins on streak freezes and XP boosts." },
    ],
  }),
  component: ShopPage,
});

type P = { streak_freezes: number; xp_boost_runs: number; coin_boost_runs?: number; magnet_runs?: number };

const ITEMS: { id: string; name: string; desc: string; price: number; icon: typeof Coins; owned: ((p: P) => number) | null }[] = [
  {
    id: "streak_freeze",
    name: "Streak freeze",
    desc: "If you miss a day, it is used automatically to protect your streak.",
    price: 150,
    icon: Shield,
    owned: (p: P) => p.streak_freezes,
  },
  {
    id: "xp_boost",
    name: "Double XP",
    desc: "Your next run of 0.5 km or more awards double XP.",
    price: 100,
    icon: Zap,
    owned: (p: P) => p.xp_boost_runs,
  },
  {
    id: "coin_boost",
    name: "Double coins",
    desc: "Your next run of 0.5 km or more awards double coins.",
    price: 120,
    icon: Coins,
    owned: (p: P) => p.coin_boost_runs ?? 0,
  },
  {
    id: "magnet",
    name: "Chest magnet",
    desc: "Collect chests from 85 m instead of 35 m during your next run.",
    price: 90,
    icon: Magnet,
    owned: (p: P) => p.magnet_runs ?? 0,
  },
  {
    id: "mystery_box",
    name: "Mystery box",
    desc: "Instant surprise reward: 20–300 coins and up to 200 XP.",
    price: 80,
    icon: Gift,
    owned: null,
  },
  {
    id: "xp_pack",
    name: "XP pack",
    desc: "Level up faster with +500 XP instantly.",
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
    if (id === "mystery_box" && r) toast.success(`🎁 Mystery box: +${r.coins} coins${r.xp ? ` · +${r.xp} XP` : ""}`);
    else toast.success(`You bought ${name}!`);
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <AppShell>
      <div>
        <h2 className="font-display text-3xl tracking-wide text-foreground">Shop</h2>
        <p className="text-sm text-muted-foreground">Canjea las coins que ganas corriendo, abriendo cofres y ganando retos.</p>
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
                {it.owned && <p className="mt-1 text-xs font-semibold text-foreground">Owned: {p ? it.owned(p as unknown as P) : 0}</p>}
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
