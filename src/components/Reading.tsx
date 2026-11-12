import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

export const readingPanel: ViewStyle = {
  backgroundColor: "rgba(247,244,239,0.96)",
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: "rgba(11,27,43,0.12)",
};

export function Reading({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    ...readingPanel,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    borderRadius: 18,
  },
});
