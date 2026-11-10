import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, fonts } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.wrap}>
      <Icon name="search" size={18} color={colors.inkSoft} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        autoCorrect={false}
        autoCapitalize="none"
        style={[styles.input, Platform.OS === "web" ? styles.webInput : null]}
        accessibilityLabel={placeholder}
      />
      {value ? (
        <Pressable accessibilityLabel="Clear search" onPress={() => onChange("")} hitSlop={8}>
          <T variant="meta">Clear</T>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.55)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.62)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 10,
  },
  webInput: { outlineWidth: 0 },
});
