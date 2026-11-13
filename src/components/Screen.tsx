import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loopFor } from "./backgrounds";
import { SceneBackground } from "./Scene";
import { DOCK_PILL } from "./Dock";
import { scenePhotos } from "@/theme";

export function Screen({
  children,
  scroll = true,
  edge = "top",
  statusBar = "light",
  photo = scenePhotos.day,
  night,
  phase,
}: {
  children: ReactNode;
  scroll?: boolean;
  edge?: "top" | "none";
  statusBar?: "dark" | "light";
  photo?: string | null;
  night?: string | null;
  phase?: string;
  docked?: boolean;
}) {
  const loop = loopFor(phase);
  const insets = useSafeAreaInsets();
  const paddingTop = edge === "top" ? insets.top + 8 : 0;
  const paddingBottom = DOCK_PILL + 16 + insets.bottom;
  const body = scroll ? (
    <ScrollView style={styles.fill} contentContainerStyle={{ paddingTop, paddingBottom }} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, { paddingTop, paddingBottom }]}>{children}</View>
  );
  return (
    <View style={styles.fill}>
      {photo ? (
        <SceneBackground
          day={loop.poster || photo}
          night={loop.posterNight || night || photo}
          phase={phase ?? photo}
          video={loop.mp4}
          poster={loop.poster}
          focus={loop.focus}
          zoom={loop.zoom}
        />
      ) : null}
      <StatusBar style={statusBar === "light" ? "light" : "dark"} />
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "transparent" },
});
