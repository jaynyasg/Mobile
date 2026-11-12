import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { ReactNode, useEffect } from "react";
import { Platform, View } from "react-native";
import { AuthProvider } from "@/community/auth";
import { ContentProvider } from "@/content/provider";
import { ImageViewerProvider } from "@/components/ImageViewer";
import { RegisterPwa } from "@/components/RegisterPwa";
import { AppProvider, useApp } from "@/store";
import { colors } from "@/theme";
import "@/global.css";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <AppProvider>
      <ContentProvider>
      <AuthProvider>
      <Boot>
        <ImageViewerProvider>
          <Frame>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
              }}
            />
            <RegisterPwa />
          </Frame>
        </ImageViewerProvider>
      </Boot>
      </AuthProvider>
      </ContentProvider>
    </AppProvider>
  );
}

function Boot({ children }: { children: ReactNode }) {
  const { hydrated } = useApp();
  const [loaded, error] = useFonts({
    "BodoniModa-Medium": require("../../assets/fonts/BodoniModa-Medium.ttf"),
    "BodoniModa-SemiBold": require("../../assets/fonts/BodoniModa-SemiBold.ttf"),
    "Manrope-Regular": require("../../assets/fonts/Manrope-Regular.ttf"),
    "Manrope-Medium": require("../../assets/fonts/Manrope-Medium.ttf"),
    "Manrope-SemiBold": require("../../assets/fonts/Manrope-SemiBold.ttf"),
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
      <View style={{ flex: 1, width: "100%", maxWidth: 440, backgroundColor: "#E7F3F4" }}>{children}</View>
    </View>
  );
}
