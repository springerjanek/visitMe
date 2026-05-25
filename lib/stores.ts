import { supabase } from "./supabase";

export type Shop = "zabka" | "biedronka";

export interface UserStore {
  id: string;
  shop: Shop;
  name: string | null;
  lat: number;
  lng: number;
}

export const GEO_RADIUS_M = 500;

export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const fetchUserStores = async (): Promise<UserStore[]> => {
  const { data, error } = await supabase
    .from("user_stores")
    .select("id, shop, name, lat, lng");
  if (error) throw error;
  return data as UserStore[];
};

export const upsertUserStore = async (
  shop: Shop,
  lat: number,
  lng: number,
  name?: string | null,
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak zalogowanego użytkownika.");

  const { error } = await supabase
    .from("user_stores")
    .upsert(
      { user_id: user.id, shop, lat, lng, name: name ?? null },
      { onConflict: "user_id,shop" },
    );
  if (error) throw error;
};
