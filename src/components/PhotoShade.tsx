import { createElement } from "react";
import { Platform, View } from "react-native";

export function PhotoShade() {
  if (Platform.OS === "web") {
    return createElement("div", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "78%",
        background: "linear-gradient(to top, rgba(6,14,24,0.9) 0%, rgba(6,14,24,0.62) 46%, rgba(6,14,24,0) 100%)",
        pointerEvents: "none",
      },
    });
  }
  return <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "72%", backgroundColor: "rgba(6,14,24,0.72)" }} />;
}
