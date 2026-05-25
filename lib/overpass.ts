import type { Shop } from "./stores";

export interface OverpassStore {
  id: number;
  lat: number;
  lng: number;
  name: string;
}

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const RADIUS_M = 2500;
const TIMEOUT_S = 25;

const QUERY: Record<Shop, string> = {
  zabka: `[out:json][timeout:${TIMEOUT_S}];
(
  node["name"="Żabka"]["shop"="convenience"](around:${RADIUS_M},LAT,LNG);
  way["name"="Żabka"]["shop"="convenience"](around:${RADIUS_M},LAT,LNG);
);
out center;`,
  biedronka: `[out:json][timeout:${TIMEOUT_S}];
(
  node["name"="Biedronka"]["shop"="supermarket"](around:${RADIUS_M},LAT,LNG);
  way["name"="Biedronka"]["shop"="supermarket"](around:${RADIUS_M},LAT,LNG);
);
out center;`,
};

export const fetchNearbyStores = async (
  shop: Shop,
  lat: number,
  lng: number,
): Promise<OverpassStore[]> => {
  const query = QUERY[shop]
    .replace(/LAT/g, String(lat))
    .replace(/LNG/g, String(lng));

  const resp = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!resp.ok) throw new Error(`Overpass error: ${resp.status}`);

  const json = await resp.json();

  if (json.remark?.includes("timed out")) {
    throw new Error("Serwer map przeciążony. Spróbuj za chwilę.");
  }

  return (json.elements as any[])
    .filter((el) => el.lat != null || el.center != null)
    .map((el) => ({
      id: el.id as number,
      lat: (el.lat ?? el.center.lat) as number,
      lng: (el.lon ?? el.center.lon) as number,
      name: (el.tags?.name ?? shop) as string,
    }));
};
