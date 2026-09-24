import { useEffect, useRef } from "react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapChest = { id: string; name: string; lat: number; lng: number; rarity: string; claimed?: boolean };

const COLORS: Record<string, string> = { bronze: "#cd7f32", silver: "#d8dde6", gold: "#ffcc33" };

/** Browser-only Leaflet map (OpenStreetMap tiles). */
export default function ChestMap({
  chests,
  me,
  onPick,
}: {
  chests: MapChest[];
  me?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const libRef = useRef<typeof L | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const Lf = (mod.default ?? mod) as typeof L;
      if (cancelled || !el.current || mapRef.current) return;
      libRef.current = Lf;
      const map = Lf.map(el.current).setView([40.4168, -3.7038], 13);
      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      map.on("click", (e) => pickRef.current?.(e.latlng.lat, e.latlng.lng));
      layerRef.current = Lf.layerGroup().addTo(map);
      mapRef.current = map;
      draw();
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = () => {
    const Lf = libRef.current;
    const layer = layerRef.current;
    if (!Lf || !layer) return;
    layer.clearLayers();
    chests.forEach((c) => {
      Lf.circleMarker([c.lat, c.lng], {
        radius: 11,
        color: "#111",
        weight: 2,
        fillColor: c.claimed ? "#555" : COLORS[c.rarity] ?? "#ffcc33",
        fillOpacity: 0.95,
      })
        .bindTooltip(`${c.claimed ? "✅" : "🎁"} ${c.name}`)
        .addTo(layer);
    });
    if (me) {
      Lf.circleMarker([me.lat, me.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#39ff88", fillOpacity: 1 })
        .bindTooltip("You")
        .addTo(layer);
    }
  };

  useEffect(draw, [chests, me]);

  useEffect(() => {
    if (me && mapRef.current) mapRef.current.panTo([me.lat, me.lng]);
  }, [me?.lat, me?.lng]);

  return <div ref={el} className="h-80 w-full overflow-hidden rounded-2xl border border-border" />;
}
