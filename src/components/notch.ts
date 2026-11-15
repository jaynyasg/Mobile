import { Platform, type ViewStyle } from "react-native";

/**
 * Clear the iOS notch, Dynamic Island, or home indicator.
 * On web, env() is the source of truth. Expo's web provider reports 0, and a
 * numeric inset plus env() would pad twice once measurement works.
 */
export function notchPadding(edge: "top" | "bottom", extra: number, inset: number): ViewStyle {
  if (Platform.OS === "web") {
    const prop = edge === "top" ? "paddingTop" : "paddingBottom";
    return { [prop]: `calc(env(safe-area-inset-${edge}, 0px) + ${extra}px)` } as ViewStyle;
  }
  return edge === "top" ? { paddingTop: inset + extra } : { paddingBottom: inset + extra };
}

/** Offset a fixed control below the notch or above the home indicator. */
export function notchOffset(edge: "top" | "bottom", extra: number, inset: number): ViewStyle {
  if (Platform.OS === "web") {
    const prop = edge === "top" ? "top" : "bottom";
    return { [prop]: `calc(env(safe-area-inset-${edge}, 0px) + ${extra}px)` } as ViewStyle;
  }
  return edge === "top" ? { top: inset + extra } : { bottom: inset + extra };
}
