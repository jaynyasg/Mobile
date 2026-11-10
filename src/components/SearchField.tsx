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
      <Icon name="search" size={18} color={colors.onDarkSoft} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.onDarkSoft}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(247,244,239,0.45)",
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.onDark,
    paddingVertical: 10,
  },
  webInput: { outlineWidth: 0 },
});
