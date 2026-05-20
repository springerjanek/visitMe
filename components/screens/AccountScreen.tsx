import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

import { Profile, fetchMyProfile, updateNickname } from "../../lib/profile";
import { supabase } from "../../lib/supabase";

import { COLORS, MONO } from "../photo/theme";

interface TrophyDef {
  id: string;
  threshold: number;
  label: string;
  caption: string;
}

const TROPHIES: TrophyDef[] = [
  { id: "first", threshold: 1, label: "PIERWSZA", caption: "pierwsza wizyta" },
  { id: "five", threshold: 5, label: "PIĄTKA", caption: "5 wizyt" },
  { id: "ten", threshold: 10, label: "DZIESIĄTKA", caption: "10 wizyt" },
  { id: "fifty", threshold: 50, label: "PÓŁSETKA", caption: "50 wizyt" },
  { id: "hundred", threshold: 100, label: "SETKA", caption: "100 wizyt" },
];

export const AccountScreen: React.FC = () => {
  const focused = useIsFocused();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [draftNick, setDraftNick] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const p = await fetchMyProfile();
      setProfile(p);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się pobrać profilu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (focused) load();
  }, [focused, load]);

  const startEdit = useCallback(() => {
    if (!profile) return;
    setDraftNick(profile.nickname);
    setEditing(true);
    setSaveError(null);
  }, [profile]);

  const saveNick = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateNickname(draftNick);
      const p = await fetchMyProfile();
      setProfile(p);
      setEditing(false);
    } catch (e: any) {
      setSaveError(e?.message ?? "Nie udało się zapisać.");
    } finally {
      setSaving(false);
    }
  }, [draftNick, saving]);

  const signOut = useCallback(() => {
    supabase.auth.signOut();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.ink} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? "Brak profilu."}</Text>
        <TouchableOpacity style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>SPRÓBUJ PONOWNIE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Text style={styles.metaCell}>KONTO</Text>
          </View>
          <View style={styles.perforation} />

          <Text style={styles.eyebrow}>NICK</Text>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                value={draftNick}
                onChangeText={setDraftNick}
                style={styles.nickInput}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={COLORS.inkGhost}
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={saveNick}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.paper} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>ZAPISZ</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={startEdit} activeOpacity={0.6}>
              <Text style={styles.nickname}>{profile.nickname}</Text>
              <Text style={styles.nickEditHint}>dotknij aby edytować</Text>
            </TouchableOpacity>
          )}
          {saveError ? (
            <Text style={styles.saveError}>✕ {saveError}</Text>
          ) : null}

          <View style={styles.hairline} />

          <Text style={styles.eyebrow}>PUNKTY</Text>
          <Text style={styles.points}>{profile.points}</Text>

          <View style={styles.hairline} />

          <Text style={styles.eyebrow}>OSIĄGNIĘCIA</Text>
          <View style={styles.trophyGrid}>
            {TROPHIES.map((t) => {
              const earned = profile.points >= t.threshold;
              return (
                <View key={t.id} style={styles.trophyCell}>
                  <View
                    style={[
                      styles.trophyBadge,
                      earned && styles.trophyBadgeEarned,
                    ]}
                  >
                    <Text
                      style={[
                        styles.trophyMark,
                        earned && styles.trophyMarkEarned,
                      ]}
                    >
                      {earned ? "★" : "·"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.trophyLabel,
                      earned && styles.trophyLabelEarned,
                    ]}
                  >
                    {t.label}
                  </Text>
                  <Text style={styles.trophyCaption}>{t.caption}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.perforation} />

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={signOut}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>WYLOGUJ SIĘ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.paperEdge },
  scroll: { padding: 16, paddingTop: 56, paddingBottom: 48 },
  center: {
    flex: 1,
    backgroundColor: COLORS.paperEdge,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: {
    fontFamily: MONO,
    fontSize: 13,
    color: COLORS.stamp,
    textAlign: "center",
    marginBottom: 18,
  },
  retry: {
    backgroundColor: COLORS.ink,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  retryText: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    color: COLORS.paper,
    fontWeight: "700",
  },
  fallbackSignOut: { marginTop: 18, padding: 8 },
  fallbackSignOutText: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 1,
    color: COLORS.inkSoft,
    textDecorationLine: "underline",
  },

  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    padding: 22,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 6,
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaCell: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1.2,
    color: COLORS.ink,
  },
  perforation: {
    borderStyle: "dashed",
    borderTopWidth: 1,
    borderColor: COLORS.hairline,
    marginVertical: 18,
    opacity: 0.55,
  },
  hairline: {
    height: 1,
    backgroundColor: COLORS.hairline,
    marginVertical: 18,
    opacity: 0.85,
  },

  eyebrow: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.inkSoft,
    marginBottom: 8,
  },

  nickname: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900",
    color: COLORS.ink,
    letterSpacing: -0.8,
  },
  nickEditHint: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.inkGhost,
    marginTop: 4,
  },
  editRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nickInput: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 22,
    color: COLORS.ink,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink,
  },
  saveBtn: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveBtnText: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    color: COLORS.paper,
  },
  saveError: {
    fontFamily: MONO,
    fontSize: 11,
    color: COLORS.stamp,
    marginTop: 6,
  },

  points: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: "900",
    color: COLORS.stamp,
    letterSpacing: -2,
  },
  pointsSub: {
    fontFamily: MONO,
    fontSize: 11,
    color: COLORS.inkSoft,
    marginTop: 4,
  },

  trophyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  trophyCell: {
    width: "33.333%",
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  trophyBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORS.inkGhost,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.paper,
    marginBottom: 6,
  },
  trophyBadgeEarned: { borderColor: COLORS.stamp, borderWidth: 2 },
  trophyMark: {
    fontSize: 22,
    color: COLORS.inkGhost,
  },
  trophyMarkEarned: { color: COLORS.stamp, fontWeight: "900" },
  trophyLabel: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.inkGhost,
  },
  trophyLabelEarned: { color: COLORS.ink },
  trophyCaption: {
    fontFamily: MONO,
    fontSize: 9,
    color: COLORS.inkSoft,
    marginTop: 2,
  },

  signOutBtn: {
    backgroundColor: COLORS.ink,
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    color: COLORS.paper,
  },
});
