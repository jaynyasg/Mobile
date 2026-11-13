import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, fonts } from "@/theme";
import { T } from "./Text";

export function Monogram({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(/[\s,]+/)
    .filter((part) => part && part !== "&")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const type = Math.round(size * 0.34);
  return (
    <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }]}>
      <T
        variant="button"
        color={colors.gold}
        style={{
          fontFamily: fonts.semibold,
          fontSize: type,
          lineHeight: type,
          letterSpacing: 0.6,
          textAlign: "center",
          width: size,
        }}
      >
        {initials}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(7,27,42,0.92)",
    ...({
      backgroundImage: "radial-gradient(circle at 50% 42%, rgba(36,64,88,0.98), rgba(7,20,33,0.96))",
    } as ViewStyle),
  },
});
