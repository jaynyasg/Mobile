import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none", height: 0 } }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="agenda" options={{ title: "Sessions" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="tickets" options={{ title: "Tickets" }} />
      <Tabs.Screen name="more" options={{ title: "Me" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
      <Tabs.Screen name="places" options={{ title: "Venues" }} />
      <Tabs.Screen name="speakers" options={{ title: "Panelists" }} />
      <Tabs.Screen name="network" options={{ title: "Network" }} />
    </Tabs>
  );
}
