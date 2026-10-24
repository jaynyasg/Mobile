import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { notifications } from "@/content";
import { Icon, IconName } from "@/components/Icon";
import { useApp } from "@/store";
import { colors, fonts } from "@/theme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const unread = notifications.filter((note) => !state.readNotificationIds.includes(note.id)).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pine,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          backgroundColor: colors.paperRaised,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => <TabIcon name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="speakers"
        options={{
          title: "Speakers",
          tabBarIcon: ({ color, size }) => <TabIcon name="mic" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: "Network",
          tabBarIcon: ({ color, size }) => <TabIcon name="people" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.clay, color: colors.ivory, fontFamily: fonts.medium, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <TabIcon name="menu" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color, size }: { name: IconName; color: unknown; size?: number }) {
  return <Icon name={name} color={typeof color === "string" ? color : colors.ink} size={size ?? 22} />;
}
