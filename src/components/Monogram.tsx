import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { T } from "./Text";

const dyes = ["#1B3330", "#6E4E2E", "#3E5C4E", "#6B4558", "#3D4F66", "#8E4034"];

function hash(name: string): number {
  let total = 0;
  for (const char of name) total = (total * 31 + char.charCodeAt(0)) >>> 0;
  return total;
}

export function Monogram({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2, backgroundColor: dyes[hash(name) % dyes.length] }]}>
      <T variant="headline" color={colors.ivory} style={{ fontSize: size * 0.32, lineHeight: size * 0.38 }}>
        {initials}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: "center", justifyContent: "center" },
});
