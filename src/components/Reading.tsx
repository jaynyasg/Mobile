import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { nightGlass } from "./nightGlass";

export const readingPanel: ViewStyle = nightGlass;

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
