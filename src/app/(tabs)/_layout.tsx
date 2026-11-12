import { Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContent } from "@/content/provider";
import { Glass } from "@/components/Glass";
import { Icon, IconName } from "@/components/Icon";
import { T } from "@/components/Text";
import { useApp } from "@/store";
import { colors } from "@/theme";

const visible = ["index", "agenda", "community", "places", "more"] as const;

const icons: Record<string, IconName> = {
  index: "home",
  agenda: "calendar",
  community: "chat",
  places: "pin",
  more: "menu",
};

export default function TabLayout() {
  const { program } = useContent();
  const { state } = useApp();
  const unread = program.notifications.filter((note) => !state.readNotificationIds.includes(note.id)).length;

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar state={props.state} navigateToTab={props.navigateToTab} unread={unread} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="agenda" options={{ title: "Program" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
      <Tabs.Screen name="places" options={{ title: "Venues" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
      <Tabs.Screen name="speakers" options={{ title: "Panelists" }} />
      <Tabs.Screen name="network" options={{ title: "Network" }} />
    </Tabs>
  );
}

function GlassTabBar({
  state,
  navigateToTab,
  unread,
}: {
  state: { index: number; routes: { key: string; name: string }[] };
  navigateToTab: (routeKey: string) => void;
  unread: number;
}) {
  const insets = useSafeAreaInsets();
  const focused = state.routes[state.index]?.name;
  const dark = focused === "index";
  const routes = state.routes.filter((route) => (visible as readonly string[]).includes(route.name));
  return (
    <View pointerEvents="box-none" style={[styles.dock, { bottom: Math.max(insets.bottom, 10) }]}>
      <Glass tone={dark ? "dark" : "light"} padded={false} style={styles.pill}>
        <View style={styles.row}>
          {routes.map((route) => {
            const active = state.routes[state.index]?.key === route.key;
            const color = active ? colors.gold : colors.foam;
            const label = route.name === "agenda" ? "Program" : route.name === "index" ? "Home" : route.name === "community" ? "Community" : route.name === "places" ? "Venues" : "More";
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
                onPress={() => navigateToTab(route.key)}
                style={styles.tab}
              >
                <Icon name={icons[route.name] ?? "menu"} color={color} size={20} />
                <T variant="meta" color={color} style={styles.label} numberOfLines={1}>
                  {label}
                </T>
                {route.name === "more" && unread > 0 ? <T variant="meta" color={colors.gold} style={styles.badge}>{unread}</T> : null}
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { position: "absolute", left: 12, right: 12 },
  pill: { borderRadius: 28 },
  row: { flexDirection: "row", alignItems: "stretch", paddingVertical: 8, paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, minHeight: 48 },
  label: { fontSize: 11, lineHeight: 13, textAlign: "center" },
  badge: { fontSize: 10, lineHeight: 12 },
});
