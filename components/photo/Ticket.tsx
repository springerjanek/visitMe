import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { Detection } from "../../lib/yolo";
import { postVisit } from "../../lib/visits";

import { PhotoEvidence } from "./PhotoEvidence";
import { COLORS, MONO } from "./theme";
import { confidenceBar, formatTicketDate } from "./utils";

interface TicketProps {
  photoUri: string;
  photoSize: { width: number; height: number };
  detections: Detection[];
  isProcessing: boolean;
  shop: string;
  distanceToStore: number | null;
  geoRadius: number;
  onReset: () => void;
}

export const Ticket: React.FC<TicketProps> = ({
  photoUri,
  photoSize,
  detections,
  isProcessing,
  shop,
  distanceToStore,
  geoRadius,
  onReset,
}) => {
  const stamp = useMemo(() => formatTicketDate(new Date()), []);
  const confirmed = !isProcessing && detections.length > 0;
  const isOutsideStore =
    distanceToStore !== null && distanceToStore > geoRadius;
  const canPublish = confirmed && !isOutsideStore;

  const topDetection = useMemo(() => {
    if (detections.length === 0) return null;
    return [...detections].sort((a, b) => b.confidence - a.confidence)[0];
  }, [detections]);

  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const handlePost = useCallback(async () => {
    if (!topDetection || posting || posted) return;
    setPosting(true);
    setPostError(null);
    try {
      await postVisit({
        photoUri,
        shop,
        detectedClass: topDetection.label,
        confidence: topDetection.confidence,
      });
      setPosted(true);
    } catch (e: any) {
      setPostError(e?.message ?? "Nie udało się opublikować.");
    } finally {
      setPosting(false);
    }
  }, [photoUri, shop, topDetection, posting, posted]);

  const { verdict, verdictSub } = (() => {
    if (isProcessing) {
      return {
        verdict: "Analizuję\nzdjęcie…",
        verdictSub: "Model analizuje, chwila cierpliwości.",
      };
    }
    if (confirmed) {
      return {
        verdict: "Wizyta\nzarejestrowana.",
        verdictSub:
          "Zdjęcie zawiera logo sklepu — twoja wizyta jest potwierdzona.",
      };
    }
    return {
      verdict: "Brak\nlogo sklepu.",
      verdictSub: "Spróbuj ponownie z lepszym kadrem lub oświetleniem.",
    };
  })();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticket}>
          <MetaStrip stamp={stamp} />
          <View style={styles.perforation} />

          <Text style={styles.verdict}>{verdict}</Text>
          <Text style={styles.verdictSub}>{verdictSub}</Text>

          <View style={styles.photoBleed}>
            <PhotoEvidence
              uri={photoUri}
              photoSize={photoSize}
              detections={detections}
            />
          </View>

          {isProcessing ? (
            <View style={styles.scanningRow}>
              <ActivityIndicator size="small" color={COLORS.stamp} />
              <Text style={styles.scanningText}>SKANOWANIE…</Text>
            </View>
          ) : (
            <DetectionsTable detections={detections} />
          )}

          {distanceToStore !== null &&
          distanceToStore > geoRadius &&
          !isProcessing ? (
            <GeoWarning distanceM={distanceToStore} />
          ) : null}

          <View style={styles.perforation} />
          <FutureRow shop={shop} posted={posted} />

          {canPublish && !posted ? (
            <>
              {postError ? (
                <Text style={styles.postError}>✕ {postError}</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.primaryAction, posting && styles.actionDisabled]}
                onPress={handlePost}
                activeOpacity={0.7}
                disabled={posting}
              >
                {posting ? (
                  <ActivityIndicator color={COLORS.paper} />
                ) : (
                  <Text style={styles.primaryActionText}>
                    OPUBLIKUJ · +1 PKT →
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : null}

          {posted ? (
            <View style={styles.postedBanner}>
              <Text style={styles.postedTop}>✓ OPUBLIKOWANO</Text>
              <Text style={styles.postedSub}>
                Wpis trafił na timeline — punkt zapisany.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              posted ? styles.primaryAction : styles.secondaryActionButton,
              isProcessing && styles.actionDisabled,
            ]}
            onPress={onReset}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <Text
              style={
                posted ? styles.primaryActionText : styles.secondaryActionText
              }
            >
              NOWE ZDJĘCIE →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const MetaStrip: React.FC<{
  stamp: ReturnType<typeof formatTicketDate>;
}> = ({ stamp }) => (
  <>
    <View style={styles.metaRow}>
      <Text style={styles.metaCell}>{stamp.weekday}</Text>
      <Text style={styles.metaCell}>{stamp.date}</Text>
      <Text style={styles.metaCell}>{stamp.time}</Text>
    </View>
    {/* <View style={styles.metaRowSub}>
      <Text style={styles.metaSubCell}>WIZYTA NUMER x</Text>
    </View> */}
  </>
);

const DetectionsTable: React.FC<{ detections: Detection[] }> = ({
  detections,
}) => (
  <>
    <View style={styles.tableHead}>
      <Text style={[styles.tableCell, styles.tableHeadText, { flex: 3 }]}>
        KLASA
      </Text>
      <Text
        style={[
          styles.tableCell,
          styles.tableHeadText,
          { flex: 4, textAlign: "left" },
        ]}
      >
        PEWNOŚĆ
      </Text>
      <Text
        style={[
          styles.tableCell,
          styles.tableHeadText,
          { flex: 1, textAlign: "right" },
        ]}
      >
        %
      </Text>
    </View>
    <View style={styles.hairline} />
    {detections.length === 0 ? (
      <Text style={styles.tableEmpty}>— nic nie wykryto —</Text>
    ) : (
      detections.map((det, idx) => (
        <View key={idx} style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 3 }]}>{det.label}</Text>
          <Text
            style={[
              styles.tableCell,
              styles.tableBar,
              { flex: 4, textAlign: "left" },
            ]}
          >
            {confidenceBar(det.confidence, 10)}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
            {(det.confidence * 100).toFixed(0)}
          </Text>
        </View>
      ))
    )}
    <View style={styles.hairline} />
  </>
);

const GeoWarning: React.FC<{ distanceM: number }> = ({ distanceM }) => (
  <View style={styles.geoWarning}>
    <Text style={styles.geoWarningTitle}>⚠ POZA SKLEPEM</Text>
    <Text style={styles.geoWarningSub}>
      Jesteś ~{Math.round(distanceM)} m od twojego zapisanego sklepu. Udaj się
      do sklepu aby otrzymać punkty za wizytę.
    </Text>
  </View>
);

const FutureRow: React.FC<{ shop: string; posted: boolean }> = ({
  shop,
  posted,
}) => (
  <View style={styles.futureRow}>
    <FutureCell label="PUNKTY" value={posted ? "+1" : "—"} />
    <FutureCell label="SIEĆ" value={shop.toUpperCase()} />
  </View>
);

const FutureCell: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.futureCell}>
    <Text style={styles.futureLabel}>{label}</Text>
    <Text style={styles.futureValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.paperEdge },
  scroll: { padding: 16, paddingTop: 56, paddingBottom: 48 },
  ticket: {
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

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaCell: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1.2,
    color: COLORS.ink,
  },
  metaRowSub: { flexDirection: "row", justifyContent: "space-between" },
  metaSubCell: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.inkSoft,
  },

  perforation: {
    marginVertical: 8,
  },
  hairline: {
    height: 1,
    backgroundColor: COLORS.hairline,
    marginVertical: 8,
    opacity: 0.85,
  },
  verdict: {
    fontSize: 38,
    lineHeight: 40,
    fontWeight: "900",
    color: COLORS.ink,
    letterSpacing: -1.2,
    marginBottom: 10,
  },
  verdictSub: {
    fontFamily: MONO,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.inkSoft,
    marginBottom: 22,
  },

  photoBleed: { marginHorizontal: -22, marginBottom: 22 },

  scanningRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  scanningText: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.stamp,
  },

  tableHead: { flexDirection: "row", marginTop: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 6 },
  tableCell: { fontFamily: MONO, fontSize: 12, color: COLORS.ink },
  tableHeadText: { fontSize: 10, letterSpacing: 1.5, color: COLORS.inkSoft },
  tableBar: { letterSpacing: 0, fontSize: 11 },
  tableEmpty: {
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.inkGhost,
    textAlign: "center",
    paddingVertical: 14,
  },

  futureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  futureCell: { flex: 1, alignItems: "center" },
  futureLabel: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.inkSoft,
    marginBottom: 4,
  },
  futureValue: {
    fontFamily: MONO,
    fontSize: 14,
    color: COLORS.inkGhost,
    fontWeight: "700",
  },

  primaryAction: {
    backgroundColor: COLORS.ink,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  primaryActionText: {
    color: COLORS.paper,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
  },
  secondaryAction: {
    textAlign: "center",
    fontFamily: MONO,
    fontSize: 15,
    color: COLORS.inkSoft,
    textDecorationLine: "underline",
    letterSpacing: 1,
  },
  secondaryActionButton: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.ink,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  secondaryActionText: {
    color: COLORS.ink,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
  },
  actionDisabled: { opacity: 0.5 },

  postError: {
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.stamp,
    marginBottom: 10,
    textAlign: "center",
  },

  postedBanner: {
    borderWidth: 1.5,
    borderColor: COLORS.signal,
    backgroundColor: COLORS.paper,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  postedTop: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    color: COLORS.signal,
    marginBottom: 4,
  },
  postedSub: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 0.5,
    color: COLORS.inkSoft,
  },

  geoWarning: {
    borderWidth: 1.5,
    borderColor: COLORS.stamp,
    backgroundColor: COLORS.paper,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  geoWarningTitle: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    color: COLORS.stamp,
    marginBottom: 4,
  },
  geoWarningSub: {
    fontFamily: MONO,
    fontSize: 11,
    color: COLORS.inkSoft,
    lineHeight: 17,
    letterSpacing: 0.3,
  },
});
