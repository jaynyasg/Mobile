import { freshReset } from "@/fresh";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { ReactNode, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { AuthProvider } from "@/community/auth";
import { ContentProvider } from "@/content/provider";
import { ImageViewerProvider } from "@/components/ImageViewer";
import { listenForInstallPrompt } from "@/components/installPrompt";
import { RegisterPwa } from "@/components/RegisterPwa";
import { ContactPrompt } from "@/components/ContactPrompt";
import { Dock } from "@/components/Dock";
import { ReelHost } from "@/reels/ReelHost";
import { AppProvider, useApp } from "@/store";
import { colors } from "@/theme";
import "@/global.css";

listenForInstallPrompt();
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [resetting, setResetting] = useState(freshReset != null);
  useEffect(() => {
    if (!freshReset) return;
    let live = true;
    freshReset.finally(() => {
      if (live) setResetting(false);
    });
    return () => {
      live = false;
    };
  }, []);
  if (resetting) return null;
  return (
    <AppProvider>
      <ContentProvider>
      <AuthProvider>
      <Boot>
        <ImageViewerProvider>
          <Frame>
            <ReelHost>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              />
              <Dock />
              <ContactPrompt />
              <RegisterPwa />
            </ReelHost>
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
