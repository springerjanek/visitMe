import React from "react";
import { Image, StyleSheet, View } from "react-native";

import type { Detection } from "../../lib/yolo";

import { COLORS } from "./theme";

interface PhotoEvidenceProps {
  uri: string;
  /** Rozmiar zdjęcia (po EXIF) — używany do dopasowania kontenera. */
  photoSize: { width: number; height: number };
  detections: Detection[];
}

export const PhotoEvidence: React.FC<PhotoEvidenceProps> = ({
  uri,
  photoSize,
  detections,
}) => {
  const aspectRatio =
    photoSize.height > 0 ? photoSize.width / photoSize.height : 1;

  return (
    <View style={[styles.frame, { aspectRatio }]}>
      <Image source={{ uri }} style={styles.image} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {detections.map((det, idx) => (
          <Bbox key={idx} detection={det} />
        ))}
      </View>
    </View>
  );
};

interface BboxProps {
  detection: Detection;
}

const Bbox: React.FC<BboxProps> = ({ detection }) => {
  const [x, y, w, h] = detection.bbox;
  return (
    <View
      style={{
        position: "absolute",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${w * 100}%`,
        height: `${h * 100}%`,
      }}
    >
      <View style={styles.bboxBorder} />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    position: "relative",
    width: "100%",
    backgroundColor: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },

  bboxBorder: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderColor: COLORS.stamp,
  },
});
