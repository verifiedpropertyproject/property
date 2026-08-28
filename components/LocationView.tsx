"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";

const MARKER_ICON_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_ICON_2X_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const MARKER_SHADOW_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

export default function LocationView({
  latitude,
  longitude,
  address,
}: {
  latitude: number;
  longitude: number;
  address: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // View-only: pan/zoom to look around is fine, but there's no marker dragging and no
      // click-to-move here — buyers/visitors can only view the saved pin, not edit it.
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([latitude, longitude], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const icon = L.icon({
        iconUrl: MARKER_ICON_URL,
        iconRetinaUrl: MARKER_ICON_2X_URL,
        shadowUrl: MARKER_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.marker([latitude, longitude], { icon, interactive: false }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  const openMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;

  return (
    <div className="flex flex-col gap-2.5">
      <div
        ref={containerRef}
        style={{ height: 260, width: "100%" }}
        className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--dk-border)]"
      />
      <p className="m-0 text-sm text-[var(--dk-muted)]">
        {address && <>{address} — </>}
        <a href={openMapUrl} target="_blank" rel="noopener noreferrer" className="dk-auth-link">
          Open in map
        </a>
      </p>
    </div>
  );
}
