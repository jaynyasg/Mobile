import { TextStyle, ViewStyle } from "react-native";

function motionOn(): boolean {
  return typeof window !== "undefined" && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function shimmerStyle(): ViewStyle {
  return {
    backgroundImage: "linear-gradient(100deg, #e7c56a 0%, #fff6d0 42%, #e7c56a 68%)",
    backgroundSize: "220% 100%",
    ...(motionOn()
      ? { animationName: "tatel-sheen", animationDuration: "4.8s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }
      : null),
  } as ViewStyle;
}

export function foilMotion(): TextStyle | null {
  if (!motionOn()) return null;
  return { animationName: "tatel-foil", animationDuration: "8s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" } as TextStyle;
}
