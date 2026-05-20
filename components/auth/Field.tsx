import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, MONO } from "../photo/theme";

interface FieldProps extends React.ComponentProps<typeof TextInput> {
  label: string;
}

export const Field: React.FC<FieldProps> = ({ label, style, ...rest }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      {...rest}
      style={[styles.fieldInput, style]}
      placeholderTextColor={COLORS.inkGhost}
    />
  </View>
);

const styles = StyleSheet.create({
  field: { marginBottom: 18 },
  fieldLabel: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.inkSoft,
    marginBottom: 6,
  },
  fieldInput: {
    fontFamily: MONO,
    fontSize: 16,
    color: COLORS.ink,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink,
  },
});
