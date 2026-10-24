import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Link } from "@tanstack/react-router";
import type { MapPoint } from "./map-types";

function Fit({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, zoom ?? map.getZoom()); }, [center?.[0], center?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
function Picker({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick?.(+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)); } });
  return null;
}

export default function DefectMap({ points, center, zoom = 12, onPick, pick, onTileError, height = 480 }: {
  points: MapPoint[]; center?: [number, number]; zoom?: number; onPick?: (lat: number, lng: number) => void;
  pick?: [number, number] | null; onTileError?: () => void; height?: number;
}) {
  return (
    <MapContainer center={center ?? [26.9, 75.795]} zoom={zoom} style={{ height, width: "100%" }} scrollWheelZoom className="rounded-xl">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={{ tileerror: () => onTileError?.() }}
      />
      <Fit center={center} zoom={zoom} />
      <Picker onPick={onPick} />
      {points.map((p) => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={p.band === "Critical" ? 10 : 8} pathOptions={{ className: `sev-${p.band.toLowerCase()}`, fillOpacity: 0.75, weight: 2 }}>
          <Popup>
            <div className="space-y-1 text-xs">
              <div className="font-mono font-semibold">{p.id}</div>
              <div>{p.title}</div>
              <div>{p.subtitle}</div>
              <div>Priority {p.score} · {p.band} · {p.status}</div>
              <div>{new Date(p.createdAt).toLocaleString()}</div>
              <Link to="/defects/$id" params={{ id: p.id }} className="font-semibold underline">Open detail →</Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {pick && <CircleMarker center={pick} radius={10} pathOptions={{ className: "sev-pick", fillOpacity: 0.9, weight: 3 }} />}
    </MapContainer>
  );
}
