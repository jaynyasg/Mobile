import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { T } from "./Text";
import { colors } from "@/theme";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function installed(): boolean {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const ios = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return Boolean(standalone || ios);
}

function iosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua);
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return ios && safari;
}

export function InstallHint() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(installed);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || dismissed) return null;
  const label = iosSafari() ? "Share, then Add to Home Screen" : prompt ? "Install" : "Add to Home Screen";

  return (
    <View style={styles.pill}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          if (prompt) prompt.prompt().catch(() => undefined);
        }}
      >
        <T variant="meta" color={colors.onDark}>{label}</T>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss install hint" onPress={() => setDismissed(true)} hitSlop={8}>
        <T variant="meta" color={colors.gold}>Close</T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(247,244,239,0.45)",
    backgroundColor: "rgba(7,18,32,0.35)",
  },
});
