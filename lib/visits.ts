import { supabase } from "./supabase";

const BUCKET = "visit-photos";

export interface Visit {
  id: string;
  user_id: string;
  shop: string;
  detected_class: string;
  confidence: number;
  photo_path: string | null;
  created_at: string;
}

export interface TimelineEntry extends Visit {
  nickname: string;
  photo_url: string | null;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  points: number;
  rank: number;
}

export interface PostVisitInput {
  photoUri: string;
  shop: string;
  detectedClass: string;
  confidence: number;
}

export const postVisit = async (input: PostVisitInput): Promise<Visit> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Brak zalogowanego użytkownika.");
  const userId = userData.user.id;

  const response = await fetch(input.photoUri);
  if (!response.ok) {
    throw new Error(`Nie udało się odczytać pliku: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const objectId = generateId();
  const path = `${userId}/${objectId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: "image/jpeg", upsert: false });

  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from("visits")
    .insert({
      user_id: userId,
      shop: input.shop,
      detected_class: input.detectedClass,
      confidence: input.confidence,
      photo_path: path,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage
      .from(BUCKET)
      .remove([path])
      .catch(() => {});
    throw insertError;
  }

  return data as Visit;
};

export const photoUrl = (path: string | null): string | null => {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const fetchTimeline = async (limit = 30): Promise<TimelineEntry[]> => {
  const { data, error } = await supabase
    .from("visits")
    .select(
      "id, user_id, shop, detected_class, confidence, photo_path, created_at, profiles(nickname)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    shop: row.shop,
    detected_class: row.detected_class,
    confidence: row.confidence,
    photo_path: row.photo_path,
    created_at: row.created_at,
    nickname: row.profiles?.nickname ?? "—",
    photo_url: photoUrl(row.photo_path),
  }));
};

export const fetchLeaderboard = async (
  limit = 10,
): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, points")
    .order("points", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row, idx) => ({ ...row, rank: idx + 1 }));
};

const generateId = (): string => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};
