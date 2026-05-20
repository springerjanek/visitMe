import { supabase } from "./supabase";

export interface Profile {
  id: string;
  nickname: string;
  points: number;
  created_at: string;
}

export const fetchMyProfile = async (): Promise<Profile> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Brak zalogowanego użytkownika.");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, points, created_at")
    .eq("id", userData.user.id)
    .single();

  if (error) throw error;
  return data as Profile;
};

export const updateNickname = async (nickname: string): Promise<void> => {
  const trimmed = nickname.trim();
  if (trimmed.length < 2) {
    throw new Error("Nick musi mieć co najmniej 2 znaki.");
  }
  if (trimmed.length > 32) {
    throw new Error("Nick nie może być dłuższy niż 32 znaki.");
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Brak zalogowanego użytkownika.");

  const { error } = await supabase
    .from("profiles")
    .update({ nickname: trimmed })
    .eq("id", userData.user.id);

  if (error) throw error;
};
