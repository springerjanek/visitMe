export interface ModelDef {
  id: string;
  displayName: string;
  source: number;
  classNames: readonly string[];
  shop: string;
}

const ZABKA_CLASSES = ["zabkaNew", "zabkaOld"] as const;
const BIEDRONKA_CLASSES = ["biedronka"] as const;

export const MODELS: readonly ModelDef[] = [
  {
    id: "zabka-aug-adamw",
    displayName: "ŻABKA · AUG (AdamW) · LR=0.0016",
    source: require("../../assets/models/zabka_aug_adamw_lr0001667.pte"),
    classNames: ZABKA_CLASSES,
    shop: "zabka",
  },
  {
    id: "zabka-adamw",
    displayName: "ŻABKA · AdamW · LR.001",
    source: require("../../assets/models/zabka_adamw_lr001.pte"),
    classNames: ZABKA_CLASSES,
    shop: "zabka",
  },
  {
    id: "zabka-auto-adamw",
    displayName: "ŻABKA · AdamW · LR.001",
    source: require("../../assets/models/zabka_auto_adamw_lr001.pte"),
    classNames: ZABKA_CLASSES,
    shop: "zabka",
  },
  {
    id: "biedra-auto",
    displayName: "BIEDRA · AdamW · LR.001",
    source: require("../../assets/models/biedra_AdamW_0.001.pte"),
    classNames: BIEDRONKA_CLASSES,
    shop: "biedronka",
  },
  {
    id: "biedra-augmented",
    displayName: "BIEDRA · AUG AdamW · LR.001",
    source: require("../../assets/models/biedra_AUG_AdamW_0.001.pte"),
    classNames: BIEDRONKA_CLASSES,
    shop: "biedronka",
  },
  {
    id: "biedra-sgd",
    displayName: "BIEDRA · SGD · LR.001",
    source: require("../../assets/models/biedra_SGD_0.001.pte"),
    classNames: BIEDRONKA_CLASSES,
    shop: "biedronka",
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export const findModel = (id: string): ModelDef =>
  MODELS.find((m) => m.id === id) ?? MODELS[0];
