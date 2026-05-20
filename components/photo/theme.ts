import { Platform } from "react-native";

export const MONO = Platform.select({
  ios: "Courier",
  android: "monospace",
  default: "monospace",
});

export const COLORS = {
  paper: "#F2EBDC",
  paperEdge: "#E5DCC5",
  ink: "#1A1814",
  inkSoft: "#5C544A",
  inkGhost: "#9A8F7E",
  stamp: "#A91D26",
  signal: "#2B6E3F",
  hairline: "#1A1814",
} as const;
