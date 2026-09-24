import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, Swords, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RunQuest — Turn your run into a game" },
      {
        name: "description",
        content: "Run, challenge your friends, wager coins, and open treasure chests hidden in real places.",
      },
      { property: "og:title", content: "RunQuest — Turn your run into a game" },
      {
        property: "og:description",
        content: "Run, challenge your friends, wager coins, and open treasure chests hidden in real places.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Zap, title: "Level up", text: "Every kilometre earns XP and coins." },
  { icon: Users, title: "Friends", text: "Add runners and compete in the rankings." },
  { icon: Swords, title: "Challenges & stakes", text: "Live or remote. Winner takes all." },
  { icon: Map, title: "Real-world chests", text: "Run to parks and landmarks to open chests." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-grid">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-5 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Running · Adventure</p>
          <h1 className="font-display text-7xl leading-none text-primary text-glow">RunQuest</h1>
          <p className="mt-3 text-lg text-foreground">Your run, turned into a multiplayer game.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-4">
              <Icon className="h-6 w-6 text-stamina" />
              <p className="mt-2 font-display text-lg text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
        <Link
          to="/auth"
          className="rounded-3xl bg-primary py-5 text-center font-display text-2xl tracking-wide text-primary-foreground card-glow"
        >
          Start playing
        </Link>
      </main>
    </div>
  );
}
