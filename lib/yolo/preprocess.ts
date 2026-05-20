import * as ImageManipulator from "expo-image-manipulator";
import * as jpeg from "jpeg-js";

import { MODEL_INPUT_SIZE } from "./types";

/**
 * Ładuje obraz z URI, skaluje do MODEL_INPUT_SIZE×MODEL_INPUT_SIZE
 * i zwraca Float32Array w formacie CHW (channels-first), znormalizowany do [0,1].
 *
 * Dekodowanie JPEG odbywa się przez jpeg-js — pure-JS, działa w Hermes
 * bez żadnych API przeglądarki (brak Image, Canvas, OffscreenCanvas).
 */
export const imageUriToFloat32CHW = async (
  uri: string,
): Promise<Float32Array> => {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
    {
      format: ImageManipulator.SaveFormat.JPEG,
      compress: 1.0,
      base64: true,
    },
  );

  if (!resized.base64) {
    throw new Error("ImageManipulator nie zwrócił base64");
  }

  const raw = atob(resized.base64);
  const jpegBytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    jpegBytes[i] = raw.charCodeAt(i);
  }

  const decoded = jpeg.decode(jpegBytes.buffer, { useTArray: true });

  const pixelData = decoded.data; // [R,G,B,A, R,G,B,A, ...]
  const pixelCount = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;

  // RGBA HWC → RGB CHW + normalizacja do [0,1]
  const tensor = new Float32Array(3 * pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    tensor[i] = pixelData[i * 4 + 0] / 255.0;
    tensor[i + pixelCount] = pixelData[i * 4 + 1] / 255.0;
    tensor[i + pixelCount * 2] = pixelData[i * 4 + 2] / 255.0;
  }

  return tensor;
};
