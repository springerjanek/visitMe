export const MODEL_INPUT_SIZE = 640;

/** Próg pewności — detekcje poniżej są odrzucane. */
export const CONF_THRESHOLD = 0.25;

/** Próg IoU dla NMS. */
export const IOU_THRESHOLD = 0.45;

export interface Detection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}
