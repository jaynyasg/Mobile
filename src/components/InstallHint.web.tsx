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

export function InstallHint({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(installed);

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

  if (hidden) return null;

  return (
    <View style={[styles.card, tone === "dark" && styles.cardDark]}>
      <T variant="eyebrow" color={tone === "dark" ? colors.gold : colors.turquoise}>Install</T>
      {iosSafari() ? (
        <T variant="small" color={tone === "dark" ? colors.onDark : colors.ink}>In Safari, tap Share, then Add to Home Screen.</T>
      ) : prompt ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Install TATEL"
          onPress={() => {
            prompt.prompt().catch(() => undefined);
            setPrompt(null);
          }}
          style={styles.button}
        >
          <T variant="button" color={colors.ink}>
            Install TATEL
          </T>
        </Pressable>
      ) : (
        <T variant="small" color={tone === "dark" ? colors.onDark : colors.ink}>Use the browser’s install icon, or the Install button when this page offers it.</T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 12,
    gap: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  button: { backgroundColor: colors.gold, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 14 },
});
