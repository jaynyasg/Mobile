import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";

export function Screen({
  children,
  scroll = true,
  edge = "top",
  statusBar = "dark",
}: {
  children: ReactNode;
  scroll?: boolean;
  edge?: "top" | "none";
  statusBar?: "dark" | "light";
}) {
  const insets = useSafeAreaInsets();
  const paddingTop = edge === "top" ? insets.top : 0;
  if (!scroll) {
    return (
      <View style={[styles.fill, { paddingTop }]}>
        <StatusBar style={statusBar === "light" ? "light" : "dark"} />
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={{ paddingTop, paddingBottom: 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar style={statusBar === "light" ? "light" : "dark"} />
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.paper },
});
