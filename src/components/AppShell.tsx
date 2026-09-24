import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Flame, Home, Map, ShoppingBag, Play, Swords, Users, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initials, useProfile } from "@/lib/game";

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/run", label: "Run", icon: Play },
  { to: "/map", label: "Chests", icon: Map },
  { to: "/races", label: "Challenges", icon: Swords },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 pb-28 pt-6">
        <header className="flex items-center gap-3">
          <Link to="/profile" aria-label="My profile" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-display text-xl text-primary-foreground card-glow">
            {p ? initials(p.display_name) : "··"}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              @{p?.username ?? "…"}
            </p>
            <h1 className="truncate font-display text-xl leading-none text-foreground">
              {p?.display_name ?? "Loading"}
            </h1>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
            <Coins className="h-4 w-4 text-xp" />
            <span className="text-sm font-bold text-foreground">{p?.coins ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
            <Flame className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-foreground">{p?.streak ?? 0}</span>
          </div>
          <button onClick={signOut} aria-label="Sign out" className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        {children}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-md justify-between px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
