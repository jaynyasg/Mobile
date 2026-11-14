import { Href, usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ReelId } from "@/content/reels";
import { useReels } from "@/reels/ReelHost";
import { colors } from "@/theme";
import { Glass } from "./Glass";
import { Icon, IconName } from "./Icon";
import { T } from "./Text";

/** Height of the two-row pill, not counting the home-indicator inset. */
export const DOCK_PILL = 112;

/** Space the page should leave so the dock never covers the last line. */
export function dockClearance(bottomInset: number): number {
  return DOCK_PILL + 12 + Math.max(bottomInset, 6);
}

type DockItem = {
  href: Href;
  label: string;
  icon: IconName;
  chapter?: ReelId;
  active: (path: string) => boolean;
};

const rows: DockItem[][] = [
  [
    { href: "/", label: "Home", icon: "home", active: (path) => path === "/" || path === "/index" },
    { href: "/agenda", label: "Sessions", icon: "calendar", chapter: "sessions", active: (path) => path.startsWith("/agenda") || path.startsWith("/session") },
    { href: "/explore", label: "Explore", icon: "pin", chapter: "venues", active: (path) => path.startsWith("/explore") || path.startsWith("/pillar") },
    { href: "/tickets", label: "Tickets", icon: "ticket", chapter: "pass", active: (path) => path.startsWith("/ticket") || path.startsWith("/passport") || path.startsWith("/pass/vip") },
    { href: "/more", label: "Me", icon: "people", active: (path) => path.startsWith("/more") || path.startsWith("/settings") },
  ],
  [
    { href: "/community", label: "Chat", icon: "chat", chapter: "community", active: (path) => path.startsWith("/community") },
    { href: "/speakers", label: "Panelists", icon: "mic", chapter: "panelists", active: (path) => path.startsWith("/speaker") },
    { href: "/know", label: "Guide", icon: "menu", chapter: "guide", active: (path) => path.startsWith("/know") },
    { href: "/transport", label: "Transport", icon: "boat", chapter: "transport", active: (path) => path.startsWith("/transport") },
    { href: "/stays", label: "Stays", icon: "seat", chapter: "stays", active: (path) => path.startsWith("/stays") },
  ],
];

export function Dock() {
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const router = useRouter();
  const { openChapter } = useReels();

  return (
    <View pointerEvents="box-none" style={[styles.dock, { bottom: Math.max(insets.bottom, 6) }]}>
      <Glass tone="dark" padded={false} style={styles.pill}>
        {rows.map((row) => (
          <View key={row[0].label} style={styles.row}>
            {row.map((item) => {
              const on = item.active(path);
              const color = on ? colors.gold : colors.foam;
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={item.label}
                  onPress={() => {
                    if (item.chapter && !on) openChapter(item.chapter, item.href);
                    else router.push(item.href);
                  }}
                  style={[styles.tab, on && styles.tabOn]}
                >
                  <Icon name={item.icon} color={color} size={18} />
                  <T variant="meta" color={color} numberOfLines={1} style={styles.label}>{item.label}</T>
                </Pressable>
              );
            })}
          </View>
        ))}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { position: "absolute", left: 8, right: 8, zIndex: 40 },
  pill: { borderRadius: 22, paddingVertical: 4, paddingHorizontal: 2 },
  row: { flexDirection: "row", alignItems: "stretch" },
  tab: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", gap: 1, borderRadius: 14 },
  tabOn: { backgroundColor: "rgba(255,224,138,0.16)" },
  label: { fontSize: 10, lineHeight: 12, textAlign: "center" },
});
