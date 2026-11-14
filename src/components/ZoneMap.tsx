import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { T } from "./Text";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";

const zones = [
  { id: "tech", name: "Tech", island: "St. Thomas", x: 18, y: 58 },
  { id: "ai", name: "AI", island: "St. John", x: 38, y: 34 },
  { id: "law", name: "Law", island: "Lovango", x: 56, y: 62 },
  { id: "entertainment", name: "Entertainment", island: "Jost Van Dyke", x: 74, y: 28 },
  { id: "travel", name: "Travel", island: "Scrub Island", x: 84, y: 52 },
] as const;

export function ZoneMap({
  progress,
  reduced,
  onPress,
}: {
  progress: Record<string, number>;
  reduced: boolean;
  onPress: (id: string) => void;
}) {
  return (
    <View style={styles.board}>
      <T variant="eyebrow" color={colors.gold}>The crossing</T>
      <View style={styles.map}>
        {zones.map((zone) => {
          const amount = Math.max(0, Math.min(1, progress[zone.id] ?? 0));
          const turn = 2 * Math.PI * 16;
          return (
            <Pressable
              key={zone.id}
              accessibilityRole="button"
              accessibilityLabel={`${zone.island}, ${zone.name}`}
              onPress={() => onPress(zone.id)}
              style={[styles.node, { left: `${zone.x}%`, top: `${zone.y}%` }]}
            >
              <Svg width={44} height={44}>
                <Circle cx={22} cy={22} r={16} stroke="rgba(255,224,138,0.35)" strokeWidth={2} fill="rgba(7,27,42,0.72)" />
                <Circle
                  cx={22}
                  cy={22}
                  r={16}
                  stroke={colors.gold}
                  strokeWidth={2.5}
                  fill="none"
                  strokeDasharray={`${turn * amount} ${turn}`}
                  strokeLinecap="round"
                  transform="rotate(-90 22 22)"
                />
              </Svg>
              <T variant="meta" color={colors.foam} numberOfLines={2} style={styles.label}>{zone.island}</T>
            </Pressable>
          );
        })}
      </View>
      {reduced ? null : <View pointerEvents="none" style={styles.sheen} />}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { marginHorizontal: 12, marginBottom: 14, padding: 14, borderRadius: 22, ...nightGlass },
  map: { height: 210, marginTop: 8 },
  node: { position: "absolute", width: 96, marginLeft: -26, alignItems: "center" },
  label: { marginTop: -4, textAlign: "center", fontSize: 12, lineHeight: 15 },
  sheen: { position: "absolute", top: 18, left: 18, right: 18, height: 1, backgroundColor: "rgba(255,224,138,0.35)" },
});
