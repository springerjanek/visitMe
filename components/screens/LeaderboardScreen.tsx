import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

import {
  LeaderboardEntry,
  TimelineEntry,
  fetchLeaderboard,
  fetchTimeline,
} from "../../lib/visits";

import { COLORS, MONO } from "../photo/theme";
import { RankRow } from "../leaderboard/RankRow";
import { TimelineCard } from "../leaderboard/TimelineCard";

export const LeaderboardScreen: React.FC = () => {
  const focused = useIsFocused();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [lb, tl] = await Promise.all([
        fetchLeaderboard(10),
        fetchTimeline(30),
      ]);
      setLeaderboard(lb);
      setTimeline(tl);
    } catch (e: any) {
      setError(e?.message ?? "Nie udało się załadować danych.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (focused) load();
  }, [focused, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(false);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.ink} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.ink}
          />
        }
      >
        {error ? <Text style={styles.error}>✕ {error}</Text> : null}

        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Text style={styles.metaCell}>RANKING</Text>
            <Text style={styles.metaCell}>TOP 10</Text>
          </View>
          <View style={styles.perforation} />

          {leaderboard.length === 0 ? (
            <Text style={styles.empty}>— jeszcze nikt nie wykrył logo —</Text>
          ) : (
            leaderboard.map((row) => <RankRow key={row.id} entry={row} />)
          )}
        </View>

        <Text style={styles.sectionHeader}>OSTATNIE WIZYTY</Text>

        {timeline.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.empty}>— brak postów —</Text>
          </View>
        ) : (
          timeline.map((entry) => <TimelineCard key={entry.id} entry={entry} />)
        )}
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
  },

  error: {
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.stamp,
    marginBottom: 12,
  },

  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    padding: 22,
    marginBottom: 22,
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

  sectionHeader: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.inkSoft,
    marginBottom: 12,
    marginLeft: 6,
  },

  emptyCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    paddingVertical: 30,
    alignItems: "center",
  },
  empty: {
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.inkGhost,
    textAlign: "center",
  },
});
