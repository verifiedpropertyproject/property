"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, PICKED_MAP_ZOOM } from "@/lib/propertyConstants";

// Hotlinked from unpkg (same version as the "leaflet" npm dependency) instead of bundling
// Leaflet's default marker images through webpack, which needs extra config to resolve. No
// key or account needed — just static files on a public CDN.
const MARKER_ICON_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_ICON_2X_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const MARKER_SHADOW_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

export type PickedLocation = {
  latitude: number;
  longitude: number;
  address: string;
  placeId: string | null;
};

type SearchResult = { placeId: string; address: string; latitude: number; longitude: number };

export default function LocationPicker({
  value,
  onChange,
}: {
  value: PickedLocation | null;
  onChange: (value: PickedLocation | null) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const initialValueRef = useRef(value);

  const [query, setQuery] = useState(value?.address || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [error, setError] = useState("");

  // Always call the latest onChange without having to re-bind map event handlers.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const placeMarker = useCallback((lat: number, lng: number) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      return;
    }

    const icon = L.icon({
      iconUrl: MARKER_ICON_URL,
      iconRetinaUrl: MARKER_ICON_2X_URL,
      shadowUrl: MARKER_SHADOW_URL,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      void handlePicked(pos.lat, pos.lng);
    });
    markerRef.current = marker;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePicked = useCallback(
    async (lat: number, lng: number, knownAddress?: string, knownPlaceId?: string | null) => {
      placeMarker(lat, lng);
      const map = mapRef.current;
      if (map) {
        map.setView([lat, lng], Math.max(map.getZoom(), PICKED_MAP_ZOOM));
      }

      if (knownAddress !== undefined) {
        setQuery(knownAddress);
        onChangeRef.current({ latitude: lat, longitude: lng, address: knownAddress, placeId: knownPlaceId ?? null });
        return;
      }

      // Reached via a map click/drag rather than a search result — we have coordinates but no
      // address yet, so reverse-geocode to fill it in.
      onChangeRef.current({ latitude: lat, longitude: lng, address: "", placeId: null });
      setReverseLoading(true);
      try {
        const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const address = data.address || "";
          setQuery(address);
          onChangeRef.current({ latitude: lat, longitude: lng, address, placeId: data.placeId ?? null });
        }
      } catch {
        // Non-critical — the pin (lat/lng) is already saved even if the address lookup fails.
      } finally {
        setReverseLoading(false);
      }
    },
    [placeMarker]
  );

  // Initialize the map once, client-side only (Leaflet needs a real DOM/window).
  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const initial = initialValueRef.current;
      const startCenter: [number, number] = initial
        ? [initial.latitude, initial.longitude]
        : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];
      const startZoom = initial ? PICKED_MAP_ZOOM : DEFAULT_MAP_ZOOM;

      const map = L.map(mapContainerRef.current).setView(startCenter, startZoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on("click", (e: Leaflet.LeafletMouseEvent) => {
        void handlePicked(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;

      if (initial) {
        placeMarker(initial.latitude, initial.longitude);
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(q: string) {
    setError("");
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Address search failed.");
        setResults([]);
        return;
      }
      setResults(data.results || []);
    } catch {
      setError("Could not reach the address search service.");
    } finally {
      setSearching(false);
    }
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleQueryChange(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 500);
  }

  function pickResult(r: SearchResult) {
    setResults([]);
    void handlePicked(r.latitude, r.longitude, r.address, r.placeId);
  }

  function useMyLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("Your browser doesn't support geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void handlePicked(pos.coords.latitude, pos.coords.longitude);
      },
      () => setError("Could not get your current location. You can still search or click the map instead.")
    );
  }

  function clearPin() {
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setQuery("");
    setResults([]);
    setError("");
    onChangeRef.current(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--dk-ink)]">
        Pin this property on the map (optional)
        <div className="relative">
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search for an address or place name"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm font-normal text-[var(--dk-ink)] outline-none transition-colors duration-150 placeholder:text-[var(--dk-placeholder)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
          />

          {results.length > 0 && (
            <ul className="dk-select-panel dk-select-open absolute m-0 list-none p-1.5" role="listbox">
              {results.map((r) => (
                <li key={r.placeId} className="dk-select-option">
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className="w-full text-left"
                  >
                    {r.address}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      {searching && <p className="m-0 text-sm text-[var(--dk-muted)]">Searching...</p>}

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3.5 py-1.5 text-sm font-semibold text-[var(--dk-heading)] transition-colors duration-150 hover:border-[var(--dk-border-hover)] hover:bg-[var(--dk-ivory)]"
        >
          Use my current location
        </button>
        {value && (
          <button
            type="button"
            onClick={clearPin}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-1.5 text-sm font-semibold text-[var(--dk-danger-ink)] transition-colors duration-150 hover:bg-[var(--dk-danger-ink)] hover:text-white"
          >
            Clear pin
          </button>
        )}
      </div>

      <div
        ref={mapContainerRef}
        style={{ height: 320, width: "100%" }}
        className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--dk-border)]"
      />

      <p className="m-0">
        <small className="text-[12.5px] text-[var(--dk-muted)]">
          {reverseLoading
            ? "Looking up the address for this pin..."
            : value
            ? `Pin set at ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}${
                value.address ? ` — ${value.address}` : ""
              }`
            : 'You can also click or tap directly on the map to drop a pin.'}
        </small>
      </p>

      {error && <p className="m-0 text-sm text-[var(--dk-danger-ink)]">{error}</p>}
    </div>
  );
}
