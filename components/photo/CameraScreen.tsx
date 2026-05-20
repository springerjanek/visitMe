import React, { forwardRef, useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/native";
import { ModelPicker } from "./ModelPicker";

import type { ModelDef } from "../../lib/yolo";

import { COLORS, MONO } from "./theme";

type CameraPosition = "back" | "front";

interface CameraScreenProps {
  modelReady: boolean;
  isProcessing: boolean;
  onCapture: () => void;
  models: readonly ModelDef[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export const CameraScreen = forwardRef<Camera, CameraScreenProps>(
  (
    {
      modelReady,
      isProcessing,
      onCapture,
      models,
      selectedModelId,
      onSelectModel,
    },
    ref,
  ) => {
    const [position, setPosition] = useState<CameraPosition>("back");
    const [pickerOpen, setPickerOpen] = useState(false);
    const device = useCameraDevice(position);
    const focused = useIsFocused();

    const flip = useCallback(() => {
      setPosition((p) => (p === "back" ? "front" : "back"));
    }, []);

    const handlePickModel = useCallback(
      (id: string) => {
        onSelectModel(id);
        setPickerOpen(false);
      },
      [onSelectModel],
    );

    const disabled = isProcessing || !modelReady || !device;
    const flipTarget = position === "back" ? "PRZÓD" : "TYŁ";
    const activeModel =
      models.find((m) => m.id === selectedModelId) ?? models[0];

    return (
      <View style={styles.container}>
        {device ? (
          <Camera
            ref={ref}
            style={styles.camera}
            device={device}
            isActive={focused}
            photo={true}
          />
        ) : (
          <View style={[styles.camera, styles.noDevice]}>
            <Text style={styles.noDeviceText}>
              BRAK KAMERY {position === "front" ? "PRZEDNIEJ" : "TYLNEJ"}
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>SELFIE TIME!</Text>
          <View style={styles.headerDivider} />
          <TouchableOpacity
            style={styles.modelChip}
            onPress={() => setPickerOpen(true)}
            disabled={isProcessing}
            activeOpacity={0.6}
          >
            <View
              style={[styles.statusDot, modelReady && styles.statusActive]}
            />
            <Text style={styles.modelLabel}>MODEL:</Text>
            <Text style={styles.modelName} numberOfLines={1}>
              {modelReady ? activeModel.displayName : "ŁADOWANIE…"}
            </Text>
            <Text style={styles.modelChevron}>⌄</Text>
          </TouchableOpacity>
        </View>

        <ModelPicker
          visible={pickerOpen}
          models={models}
          selectedId={selectedModelId}
          onPick={handlePickModel}
          onClose={() => setPickerOpen(false)}
        />

        <View style={styles.overlay}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.captureButton, disabled && styles.captureDisabled]}
              onPress={onCapture}
              disabled={disabled}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator color={COLORS.paper} />
              ) : (
                <Text style={styles.captureText}>ZRÓB ZDJĘCIE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flipButton}
              onPress={flip}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              <Text style={styles.flipText}>{flipTarget}</Text>
              <Text style={styles.flipHint}>⇄</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
);

CameraScreen.displayName = "CameraScreen";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  camera: { flex: 1 },
  header: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.ink,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: "700",
    color: COLORS.ink,
  },
  signOut: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.inkSoft,
    textDecorationLine: "underline",
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.ink,
    marginVertical: 8,
    opacity: 0.5,
  },
  modelChip: { flexDirection: "row", alignItems: "center", gap: 8 },
  modelLabel: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.inkSoft,
  },
  modelName: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "700",
    color: COLORS.ink,
  },
  modelChevron: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.ink,
    marginTop: -4,
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.inkSoft,
  },
  statusActive: { backgroundColor: COLORS.signal },

  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
  },
  actionRow: { flexDirection: "row", gap: 10 },
  captureButton: {
    flex: 1,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.ink,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  captureDisabled: { opacity: 0.4 },
  captureText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    color: COLORS.ink,
  },

  flipButton: {
    width: 84,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  flipText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: COLORS.ink,
  },
  flipHint: {
    fontFamily: MONO,
    fontSize: 14,
    color: COLORS.inkSoft,
    marginTop: 2,
  },

  noDevice: {
    backgroundColor: COLORS.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  noDeviceText: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    color: COLORS.paper,
  },
});
