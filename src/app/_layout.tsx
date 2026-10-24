import { Fraunces_500Medium, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from "@expo-google-fonts/outfit";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { ReactNode, useEffect } from "react";
import { Platform, View } from "react-native";
import { AppProvider, useApp } from "@/store";
import { colors } from "@/theme";
import "@/global.css";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <AppProvider>
      <Boot>
        <Frame>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.paper },
            }}
          />
        </Frame>
      </Boot>
    </AppProvider>
  );
}

function Boot({ children }: { children: ReactNode }) {
  const { hydrated } = useApp();
  const [loaded, error] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  useEffect(() => {
    if ((loaded || error) && hydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded, error, hydrated]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.paper).catch(() => undefined);
  }, []);

  if ((!loaded && !error) || !hydrated) return null;
  return children;
}

function Frame({ children }: { children: ReactNode }) {
  if (Platform.OS !== "web") return children;
  return (
    <View style={{ flex: 1, backgroundColor: colors.stage, alignItems: "center" }}>
      <View style={{ flex: 1, width: "100%", maxWidth: 440, backgroundColor: colors.paper }}>{children}</View>
    </View>
  );
}
