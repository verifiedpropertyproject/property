import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";

// Free, keyless forward geocoding via OpenStreetMap's Nominatim, used by the map picker's
// address search box. Proxied server-side (rather than called from the browser) so we can:
//   - set the User-Agent/Referer Nominatim's usage policy requires
//   - keep the 1 req/sec rate-limit courtesy on our side, not the client's
// See https://operations.osmfoundation.org/policies/nominatim/
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "notify-app-property-listings/1.0 (contact: set NOMINATIM_CONTACT_EMAIL env var)";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }
    if (q.length > 200) {
      return NextResponse.json({ error: "Query is too long." }, { status: 400 });
    }

    const url = new URL(`${NOMINATIM_BASE}/search`);
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": process.env.NOMINATIM_CONTACT_EMAIL
          ? `notify-app-property-listings/1.0 (${process.env.NOMINATIM_CONTACT_EMAIL})`
          : USER_AGENT,
        "Accept-Language": "en",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "The address search service is unavailable right now." }, { status: 502 });
    }

    const results = (await res.json()) as Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;

    return NextResponse.json({
      results: results.map((r) => ({
        placeId: String(r.place_id),
        address: r.display_name,
        latitude: Number(r.lat),
        longitude: Number(r.lon),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
