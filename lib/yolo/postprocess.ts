import {
  CONF_THRESHOLD,
  Detection,
  IOU_THRESHOLD,
  MODEL_INPUT_SIZE,
} from "./types";

/**
 * Parsuje surowe wyjście modelu YOLO z ExecuTorch.
 *
 * YOLO eksportowane przez Ultralytics do ExecuTorch zwraca tensor o kształcie:
 *   [1, 4 + NUM_CLASSES, num_anchors]  (np. [1, 6, 8400] dla 2 klas)
 *
 * Każdy anchor zawiera [cx, cy, w, h, score_class0, score_class1, ...]
 * gdzie cx/cy/w/h są w skali wejściowego obrazu (0–MODEL_INPUT_SIZE).
 *
 * Założenie: oryginalne zdjęcie było zresizowane (bez letterboxa) do
 * MODEL_INPUT_SIZE×MODEL_INPUT_SIZE, więc każda oś została skalowana niezależnie.
 * Dzięki temu bbox w ułamkach (0–1) odpowiada 1:1 oryginalnemu obrazowi.
 */
export const parseYoloOutput = (
  outputBuffer: ArrayBuffer,
  outputSizes: number[],
  classNames: readonly string[],
): Detection[] => {
  const numClasses = classNames.length;
  const data = new Float32Array(outputBuffer);

  // [batch, 4+numClasses, anchors] vs. [batch, anchors, 4+numClasses]
  const transposed = outputSizes[1] !== 4 + numClasses;
  const numAnchors = transposed ? outputSizes[1] : outputSizes[2];
  const rowStride = transposed ? 4 + numClasses : numAnchors;

  const candidates: Detection[] = [];

  for (let a = 0; a < numAnchors; a++) {
    let cx: number;
    let cy: number;
    let w: number;
    let h: number;
    const classScores: number[] = [];

    if (!transposed) {
      cx = data[0 * numAnchors + a];
      cy = data[1 * numAnchors + a];
      w = data[2 * numAnchors + a];
      h = data[3 * numAnchors + a];
      for (let c = 0; c < numClasses; c++) {
        classScores.push(data[(4 + c) * numAnchors + a]);
      }
    } else {
      const base = a * rowStride;
      cx = data[base + 0];
      cy = data[base + 1];
      w = data[base + 2];
      h = data[base + 3];
      for (let c = 0; c < numClasses; c++) {
        classScores.push(data[base + 4 + c]);
      }
    }

    let bestScore = -Infinity;
    let bestClass = 0;
    for (let c = 0; c < classScores.length; c++) {
      if (classScores[c] > bestScore) {
        bestScore = classScores[c];
        bestClass = c;
      }
    }

    if (bestScore < CONF_THRESHOLD) continue;

    // Model coords (0..MODEL_INPUT_SIZE) → fractions (0..1) of the source image.
    // Per-axis squish means fractions map 1:1 between model space and original.
    const fx = (cx - w / 2) / MODEL_INPUT_SIZE;
    const fy = (cy - h / 2) / MODEL_INPUT_SIZE;
    const fw = w / MODEL_INPUT_SIZE;
    const fh = h / MODEL_INPUT_SIZE;

    const clampedX = Math.max(0, Math.min(1, fx));
    const clampedY = Math.max(0, Math.min(1, fy));
    const clampedW = Math.max(0, Math.min(1 - clampedX, fw));
    const clampedH = Math.max(0, Math.min(1 - clampedY, fh));

    candidates.push({
      label: classNames[bestClass] ?? `class_${bestClass}`,
      confidence: bestScore,
      bbox: [clampedX, clampedY, clampedW, clampedH],
    });
  }

  return nms(candidates);
};

/** IoU dwóch bboxów [x,y,w,h]. */
const iou = (a: Detection["bbox"], b: Detection["bbox"]): number => {
  const ax2 = a[0] + a[2];
  const ay2 = a[1] + a[3];
  const bx2 = b[0] + b[2];
  const by2 = b[1] + b[3];

  const interX = Math.max(0, Math.min(ax2, bx2) - Math.max(a[0], b[0]));
  const interY = Math.max(0, Math.min(ay2, by2) - Math.max(a[1], b[1]));
  const inter = interX * interY;

  const areaA = a[2] * a[3];
  const areaB = b[2] * b[3];
  const union = areaA + areaB - inter;

  return union > 0 ? inter / union : 0;
};

/** Greedy NMS po klasach. */
const nms = (detections: Detection[]): Detection[] => {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: Detection[] = [];

  while (sorted.length > 0) {
    const best = sorted.shift()!;
    kept.push(best);

    for (let i = sorted.length - 1; i >= 0; i--) {
      if (
        sorted[i].label === best.label &&
        iou(sorted[i].bbox, best.bbox) > IOU_THRESHOLD
      ) {
        sorted.splice(i, 1);
      }
    }
  }

  return kept;
};
