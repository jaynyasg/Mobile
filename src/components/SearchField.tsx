import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, fonts, pad } from "@/theme";
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
    marginHorizontal: pad,
    marginBottom: 8,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
