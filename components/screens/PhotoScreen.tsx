import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Camera, useCameraPermission } from "react-native-vision-camera";
import { ScalarType, useExecutorchModule } from "react-native-executorch";
import * as Location from "expo-location";

import {
  DEFAULT_MODEL_ID,
  Detection,
  MODELS,
  MODEL_INPUT_SIZE,
  findModel,
  imageUriToFloat32CHW,
  parseYoloOutput,
} from "../../lib/yolo";
import { useHomeStores } from "../../hooks/useHomeStores";
import { distanceMeters, GEO_RADIUS_M } from "../../lib/stores";

import { CameraScreen } from "../photo/CameraScreen";
import { Ticket } from "../photo/Ticket";
import { COLORS, MONO } from "../photo/theme";

interface PhotoSize {
  width: number;
  height: number;
}

export const Photo: React.FC = () => {
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  const [selectedModelId, setSelectedModelId] =
    useState<string>(DEFAULT_MODEL_ID);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState<PhotoSize | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [distanceToStore, setDistanceToStore] = useState<number | null>(null);

  const activeModel = findModel(selectedModelId);
  const model = useExecutorchModule({ modelSource: activeModel.source });
  const { stores } = useHomeStores();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const reset = useCallback(() => {
    setPhotoUri(null);
    setPhotoSize(null);
    setDetections([]);
    setDistanceToStore(null);
  }, []);

  const checkProximity = useCallback(
    async (shop: string) => {
      const homeStore = stores?.[shop as "zabka" | "biedronka"] ?? null;
      if (!homeStore) return;

      const loc = await Location.getLastKnownPositionAsync();
      const coords = loc?.coords ?? null;
      if (!coords) return;

      const dist = distanceMeters(
        coords.latitude,
        coords.longitude,
        homeStore.lat,
        homeStore.lng,
      );

      console.log(dist);
      setDistanceToStore(dist);
    },
    [stores],
  );

  const capture = useCallback(async () => {
    if (!cameraRef.current || isProcessing || !model.isReady) return;

    setIsProcessing(true);
    setDetections([]);
    setDistanceToStore(null);

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: "off",
        enableAutoRedEyeReduction: false,
      });
      const uri = `file://${photo.path}`;

      const size = await new Promise<PhotoSize>((resolve) => {
        Image.getSize(
          uri,
          (width, height) => resolve({ width, height }),
          () => resolve({ width: photo.width, height: photo.height }),
        );
      });

      setPhotoUri(uri);
      setPhotoSize(size);

      const tensorData = await imageUriToFloat32CHW(uri);
      const outputs = await model.forward([
        {
          dataPtr: tensorData,
          sizes: [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE],
          scalarType: ScalarType.FLOAT,
        },
      ]);

      if (!outputs || outputs.length === 0) {
        Alert.alert("Brak wyjścia", "Model nie zwrócił żadnych tensorów.");
        return;
      }

      const out = outputs[0];
      const found = parseYoloOutput(
        out.dataPtr as ArrayBuffer,
        out.sizes,
        activeModel.classNames,
      );
      console.log(
        `📐 Output sizes: [${out.sizes.join(", ")}] — ${found.length} detekcji`,
      );
      setDetections(found);

      if (found.length > 0) {
        await checkProximity(activeModel.shop);
      }
    } catch (error: any) {
      console.error("❌ Błąd:", error);
      Alert.alert(
        "Błąd",
        error?.message ?? "Nie udało się przetworzyć zdjęcia",
      );
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, model, activeModel, checkProximity]);

  if (!hasPermission) {
    return (
      <Fallback message="Potrzebuję dostępu do kamery">
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>PRZYZNAJ DOSTĘP</Text>
        </TouchableOpacity>
      </Fallback>
    );
  }

  if (photoUri && photoSize) {
    return (
      <Ticket
        photoUri={photoUri}
        photoSize={photoSize}
        detections={detections}
        isProcessing={isProcessing}
        shop={activeModel.shop}
        distanceToStore={distanceToStore}
        geoRadius={GEO_RADIUS_M}
        onReset={reset}
      />
    );
  }

  return (
    <CameraScreen
      ref={cameraRef}
      modelReady={model.isReady}
      isProcessing={isProcessing}
      onCapture={capture}
      models={MODELS}
      selectedModelId={selectedModelId}
      onSelectModel={setSelectedModelId}
    />
  );
};

interface FallbackProps {
  message: string;
  children?: React.ReactNode;
}

const Fallback: React.FC<FallbackProps> = ({ message, children }) => (
  <View style={styles.fallback}>
    <Text style={styles.fallbackMessage}>{message}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: COLORS.paperEdge,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  fallbackMessage: {
    fontFamily: MONO,
    fontSize: 14,
    letterSpacing: 1,
    color: COLORS.ink,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.ink,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: COLORS.paper,
  },
});
