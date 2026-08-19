import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";

// Free, keyless reverse geocoding via OpenStreetMap's Nominatim — turns a dropped/dragged pin
// (lat/lng) into a human-readable address + place id. See app/api/geocode/search/route.ts for
// why this is proxied server-side.
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "notify-app-property-listings/1.0 (contact: set NOMINATIM_CONTACT_EMAIL env var)";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latRaw = searchParams.get("lat");
    const lonRaw = searchParams.get("lon");

    const lat = Number(latRaw);
    const lon = Number(lonRaw);

    if (!latRaw || !lonRaw || Number.isNaN(lat) || Number.isNaN(lon)) {
      return NextResponse.json({ error: "Valid lat and lon are required." }, { status: 400 });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: "lat/lon out of range." }, { status: 400 });
    }

    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "jsonv2");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": process.env.NOMINATIM_CONTACT_EMAIL
          ? `notify-app-property-listings/1.0 (${process.env.NOMINATIM_CONTACT_EMAIL})`
          : USER_AGENT,
        "Accept-Language": "en",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "The reverse-geocoding service is unavailable right now." }, { status: 502 });
    }

    const result = (await res.json()) as { place_id?: number; display_name?: string };

    return NextResponse.json({
      placeId: result.place_id ? String(result.place_id) : null,
      address: result.display_name || null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
