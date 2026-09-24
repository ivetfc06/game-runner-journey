import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, Swords, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RunQuest — Convierte tu carrera en un videojuego" },
      {
        name: "description",
        content: "Corre, reta a tus amigos, apuesta monedas y abre cofres del tesoro escondidos en lugares reales.",
      },
      { property: "og:title", content: "RunQuest — Convierte tu carrera en un videojuego" },
      {
        property: "og:description",
        content: "Corre, reta a tus amigos, apuesta monedas y abre cofres del tesoro escondidos en lugares reales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Zap, title: "Sube de nivel", text: "Cada kilómetro te da XP y monedas." },
  { icon: Users, title: "Amigos", text: "Añade corredores y compite en el ranking." },
  { icon: Swords, title: "Retos y apuestas", text: "En directo o a distancia. Quien gana se lo lleva todo." },
  { icon: Map, title: "Cofres reales", text: "Corre hasta parques y monumentos para abrir cofres." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-grid">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-5 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Running · Juego</p>
          <h1 className="font-display text-7xl leading-none text-primary text-glow">RunQuest</h1>
          <p className="mt-3 text-lg text-foreground">Tu carrera, convertida en un videojuego multijugador.</p>
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
          Empezar a jugar
        </Link>
      </main>
    </div>
  );
}
