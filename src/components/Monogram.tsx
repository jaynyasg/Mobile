import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { T } from "./Text";

export function Monogram({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <View style={[styles.disc, { width: size, height: size }]}>
      <T variant="headline" color={colors.gold} style={{ fontSize: size * 0.32, lineHeight: size * 0.38 }}>
        {initials}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: "center", justifyContent: "center" },
});
