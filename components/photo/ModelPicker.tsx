import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ModelDef } from "../../lib/yolo";
import { COLORS, MONO } from "./theme";

interface ModelPickerProps {
  visible: boolean;
  models: readonly ModelDef[];
  selectedId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({
  visible,
  models,
  selectedId,
  onPick,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.sheetEyebrow}>WYBIERZ MODEL</Text>
        <View style={styles.sheetDivider} />
        {models.map((m) => {
          const selected = m.id === selectedId;
          return (
            <TouchableOpacity
              key={m.id}
              style={styles.sheetRow}
              onPress={() => onPick(m.id)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.sheetMarker,
                  selected && styles.sheetMarkerActive,
                ]}
              >
                {selected ? "▣" : "▢"}
              </Text>
              <View style={styles.sheetRowText}>
                <Text style={styles.sheetRowName}>{m.displayName}</Text>
                <Text style={styles.sheetRowMeta}>
                  {m.classNames.length} klas · {m.classNames.join(", ")}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
          <Text style={styles.sheetClose}>zamknij</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26,24,20,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderColor: COLORS.ink,
    padding: 22,
    paddingBottom: 36,
  },
  sheetEyebrow: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.stamp,
    marginBottom: 6,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: COLORS.ink,
    marginBottom: 12,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
  },
  sheetMarker: {
    fontFamily: MONO,
    fontSize: 18,
    color: COLORS.inkSoft,
    width: 20,
    textAlign: "center",
  },
  sheetMarkerActive: { color: COLORS.stamp },
  sheetRowText: { flex: 1 },
  sheetRowName: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.ink,
    marginBottom: 2,
  },
  sheetRowMeta: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 0.5,
    color: COLORS.inkSoft,
  },
  sheetClose: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.inkSoft,
    textDecorationLine: "underline",
    textAlign: "center",
    marginTop: 14,
  },
});
