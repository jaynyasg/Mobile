import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loopFor } from "./backgrounds";
import { SceneBackground } from "./Scene";
import { dockClearance } from "./Dock";
import { notchPadding } from "./notch";
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
  const clearance = dockClearance(insets.bottom);
  const top = edge === "top" ? notchPadding("top", 8, insets.top) : null;
  const body = scroll ? (
    <ScrollView style={styles.fill} contentContainerStyle={[{ paddingBottom: clearance + 24 }, top]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, { marginBottom: clearance }, top]}>{children}</View>
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
