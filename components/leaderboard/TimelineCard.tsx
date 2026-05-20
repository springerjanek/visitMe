import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { TimelineEntry } from "../../lib/visits";
import { relativeTime } from "../../lib/time";

import { COLORS, MONO } from "../photo/theme";

interface TimelineCardProps {
  entry: TimelineEntry;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ entry }) => (
  <View style={styles.card}>
    {entry.photo_url ? (
      <Image source={{ uri: entry.photo_url }} style={styles.photo} />
    ) : (
      <View style={[styles.photo, styles.photoMissing]}>
        <Text style={styles.photoMissingText}>BRAK ZDJĘCIA</Text>
      </View>
    )}
    <View style={styles.meta}>
      <View style={styles.metaRow}>
        <Text style={styles.nick}>User: {entry.nickname}</Text>
        <Text style={styles.when}>{relativeTime(entry.created_at)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.class}>{entry.detected_class}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    marginBottom: 18,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 6,
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORS.ink,
  },
  photoMissing: { alignItems: "center", justifyContent: "center" },
  photoMissingText: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.paper,
  },
  meta: { padding: 14 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  nick: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.3,
    color: COLORS.ink,
  },
  when: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.inkSoft,
  },
  class: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.stamp,
  },
});
