export interface ModelDef {
  id: string;
  displayName: string;
  source: number;
  classNames: readonly string[];
  shop: string;
}

const ZABKA_CLASSES = ["zabkaNew", "zabkaOld"] as const;

export const MODELS: readonly ModelDef[] = [
  {
    id: "zabka-aug-adamw",
    displayName: "ŻABKA · AUG (AdamW)",
    source: require("../../assets/models/zabka_AUG_AUTO=AdamW,LR=0.001667.pte"),
    classNames: ZABKA_CLASSES,
    shop: "zabka",
  },
  {
    id: "zabka-adamw",
    displayName: "ŻABKA · AdamW LR.001",
    source: require("../../assets/models/zabka_LR=0.001,OPTIMIZE=AdamW.pte"),
    classNames: ZABKA_CLASSES,
    shop: "zabka",
  },
  {
    id: "zabka-auto-adamw",
    displayName: "ŻABKA · AUTO LR.001",
    source: require("../../assets/models/zabka_LR=0.001,OPTIMIZER=AUTO=AdamW.pte"),
    classNames: ZABKA_CLASSES,
    shop: "zabka",
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export const findModel = (id: string): ModelDef =>
  MODELS.find((m) => m.id === id) ?? MODELS[0];
