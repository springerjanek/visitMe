import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { LeaderboardEntry } from "../../lib/visits";

import { COLORS, MONO } from "../photo/theme";

interface RankRowProps {
  entry: LeaderboardEntry;
}

export const RankRow: React.FC<RankRowProps> = ({ entry }) => (
  <View style={styles.row}>
    <Text style={styles.index}>{String(entry.rank).padStart(2, "0")}.</Text>
    <Text style={styles.nick} numberOfLines={1}>
      {entry.nickname}
    </Text>
    <Text style={styles.points}>{entry.points}</Text>
    <Text style={styles.pointsLabel}>pkt</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingVertical: 8,
    gap: 10,
  },
  index: {
    fontFamily: MONO,
    fontSize: 13,
    color: COLORS.inkSoft,
    width: 28,
  },
  nick: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.ink,
  },
  points: {
    fontFamily: MONO,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.stamp,
  },
  pointsLabel: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.inkSoft,
  },
});
