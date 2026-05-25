import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";

import { fetchNearbyStores, OverpassStore } from "../../lib/overpass";
import { upsertUserStore, Shop } from "../../lib/stores";
import { COLORS, MONO } from "../photo/theme";

const STEPS: { shop: Shop; label: string; color: string }[] = [
  { shop: "zabka", label: "ŻABKĘ", color: "#006B3E" },
  { shop: "biedronka", label: "BIEDRONKĘ", color: "#CC0000" },
];

interface Props {
  onComplete: () => void;
  /** When provided a close button is shown — use in settings/edit context. */
  onClose?: () => void;
}

export const StorePickerScreen: React.FC<Props> = ({ onComplete, onClose }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const mapRef = useRef<MapView>(null);

  const [phase, setPhase] = useState<"locating" | "loading" | "ready" | "error">("locating");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stores, setStores] = useState<OverpassStore[]>([]);
  const [selected, setSelected] = useState<OverpassStore | null>(null);
  const [saving, setSaving] = useState(false);

  const loadForStep = useCallback(async () => {
    setPhase("locating");
    setErrorMsg(null);
    setStores([]);
    setSelected(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPhase("error");
        setErrorMsg("Potrzebuję dostępu do lokalizacji żeby znaleźć pobliskie sklepy.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setUserCoords(coords);
      setPhase("loading");

      mapRef.current?.animateToRegion(
        { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        400,
      );

      const nearby = await fetchNearbyStores(step.shop, coords.lat, coords.lng);
      setStores(nearby);
      setPhase("ready");
    } catch (e: any) {
      setPhase("error");
      setErrorMsg(e?.message ?? "Coś poszło nie tak. Spróbuj ponownie.");
    }
  }, [step.shop]);

  useEffect(() => {
    loadForStep();
  }, [loadForStep]);

  const handleConfirm = useCallback(async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await upsertUserStore(step.shop, selected.lat, selected.lng, selected.name);
      if (stepIdx < STEPS.length - 1) {
        setStepIdx((i) => i + 1);
      } else {
        onComplete();
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Nie udało się zapisać sklepu.");
    } finally {
      setSaving(false);
    }
  }, [selected, saving, step.shop, stepIdx, onComplete]);

  const initialRegion: Region = {
    latitude: userCoords?.lat ?? 52.237049,
    longitude: userCoords?.lng ?? 21.017532,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.stepBadge}>
            KROK {stepIdx + 1} / {STEPS.length}
          </Text>
          {onClose ? (
            <TouchableOpacity onPress={onClose} activeOpacity={0.6} hitSlop={12}>
              <Text style={styles.closeBtn}>✕ ZAMKNIJ</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.title}>
          Wybierz swoją{"\n"}
          <Text style={[styles.titleShop, { color: step.color }]}>
            {step.label}
          </Text>
        </Text>
        <Text style={styles.subtitle}>
          Dotknij markera na mapie, żeby wskazać sklep, który odwiedzasz.
        </Text>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {stores.map((store) => (
            <Marker
              key={store.id}
              coordinate={{ latitude: store.lat, longitude: store.lng }}
              title={store.name}
              pinColor={selected?.id === store.id ? step.color : COLORS.inkSoft}
              onPress={() => setSelected(store)}
            />
          ))}
        </MapView>

        {(phase === "locating" || phase === "loading") && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator color={COLORS.ink} />
            <Text style={styles.mapOverlayText}>
              {phase === "locating" ? "Szukam twojej lokalizacji…" : "Ładuję sklepy…"}
            </Text>
          </View>
        )}

        {phase === "ready" && stores.length === 0 && (
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>
              Nie znaleziono sklepów w promieniu 2.5 km.{"\n"}Spróbuj przybliżyć mapę ręcznie.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottom}>
        {errorMsg ? <Text style={styles.error}>✕ {errorMsg}</Text> : null}

        {selected ? (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedLabel}>WYBRANY SKLEP</Text>
            <Text style={styles.selectedName} numberOfLines={1}>
              {selected.name}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.confirmBtn, (!selected || saving) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selected || saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.paper} />
          ) : (
            <Text style={styles.confirmBtnText}>
              {stepIdx < STEPS.length - 1 ? "POTWIERDŹ · DALEJ →" : "POTWIERDŹ · GOTOWE →"}
            </Text>
          )}
        </TouchableOpacity>

        {phase === "error" ? (
          <TouchableOpacity style={styles.retryBtn} onPress={loadForStep} activeOpacity={0.7}>
            <Text style={styles.retryBtnText}>SPRÓBUJ PONOWNIE</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.paperEdge },

  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 32,
    paddingHorizontal: 22,
    paddingBottom: 16,
    backgroundColor: COLORS.paper,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stepBadge: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2.5,
    color: COLORS.stamp,
  },
  closeBtn: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.inkSoft,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.ink,
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 8,
  },
  titleShop: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: MONO,
    fontSize: 11,
    color: COLORS.inkSoft,
    lineHeight: 17,
    letterSpacing: 0.3,
  },

  mapWrapper: { flex: 1, position: "relative" },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(242,235,220,0.82)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  mapOverlayText: {
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.5,
  },

  bottom: {
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    gap: 12,
  },
  selectedRow: { gap: 2 },
  selectedLabel: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.inkSoft,
  },
  selectedName: {
    fontFamily: MONO,
    fontSize: 14,
    color: COLORS.ink,
    fontWeight: "700",
  },
  error: {
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.stamp,
    lineHeight: 18,
  },
  confirmBtn: {
    backgroundColor: COLORS.ink,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.35 },
  confirmBtnText: {
    color: COLORS.paper,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: COLORS.ink,
    paddingVertical: 14,
    alignItems: "center",
  },
  retryBtnText: {
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.ink,
    letterSpacing: 2,
  },
});
