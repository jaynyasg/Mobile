import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { Glass } from "./Glass";
import { T } from "./Text";
import {
  clearInstallPrompt,
  getInstallPrompt,
  INSTALL_DISMISS_KEY,
  installChoice,
  installHiddenUntil,
  installOffersCopy,
  installSteps,
  rememberInstallDismiss,
  subscribeInstallPrompt,
  type InstallChoice,
  type InstallIcon,
} from "./installPrompt";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";

type Guide = Exclude<InstallChoice, "hide" | "prompt">;

function browserContext(hasPrompt: boolean) {
  const standalone = typeof window !== "undefined" && Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches);
  const navigatorStandalone = typeof navigator !== "undefined" && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return {
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    displayModeStandalone: standalone,
    navigatorStandalone,
    maxTouchPoints: typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints,
    hasPrompt,
  };
}

function storedDismiss(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return installHiddenUntil(localStorage.getItem(INSTALL_DISMISS_KEY), Date.now());
  } catch {
    return false;
  }
}

function rememberDismiss() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(INSTALL_DISMISS_KEY, rememberInstallDismiss(Date.now()));
  } catch {
    // Private mode can refuse storage. The in-memory flag still hides it this visit.
  }
}

export function InstallHint() {
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState(getInstallPrompt);
  const [standalone, setStandalone] = useState(() => typeof window !== "undefined" && installChoice(browserContext(false)) === "hide");
  const [dismissed, setDismissed] = useState(storedDismiss);
  const [guide, setGuide] = useState<Guide | null>(null);

  useEffect(() => subscribeInstallPrompt(() => setPrompt(getInstallPrompt())), []);

  useEffect(() => {
    const read = () => setStandalone(installChoice(browserContext(false)) === "hide");
    read();
    const media = window.matchMedia?.("(display-mode: standalone)");
    media?.addEventListener?.("change", read);
    return () => media?.removeEventListener?.("change", read);
  }, []);

  useEffect(() => {
    if (!guide) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guide]);

  function dismiss() {
    rememberDismiss();
    setGuide(null);
    setDismissed(true);
  }

  if (standalone || dismissed) return null;

  async function onAdd() {
    const event = prompt ?? getInstallPrompt();
    if (event && installChoice(browserContext(true)) === "prompt") {
      try {
        await event.prompt();
      } catch {
        clearInstallPrompt();
        setGuide("menu");
        return;
      }
      try {
        const result = await event.userChoice;
        clearInstallPrompt();
        if (result?.outcome === "accepted") setStandalone(true);
        else dismiss();
      } catch {
        clearInstallPrompt();
      }
      return;
    }
    const next = installChoice(browserContext(false));
    setGuide(next === "hide" || next === "prompt" ? "menu" : next);
  }

  if (guide) return <InstallSheet kind={guide} bottom={insets.bottom} onClose={dismiss} />;

  const installLabel = prompt ? "Install" : "Add to Home Screen";
  return (
    <View style={styles.pill}>
      <Pressable accessibilityRole="button" accessibilityLabel={installLabel} onPress={() => onAdd().catch(() => setGuide("menu"))} style={styles.add}>
        <T variant="meta" color={colors.onDark} numberOfLines={1}>{installLabel}</T>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss install hint" onPress={dismiss} style={styles.dismiss}>
        <T variant="meta" color={colors.gold}>Close</T>
      </Pressable>
    </View>
  );
}

function InstallSheet({ kind, bottom, onClose }: { kind: Guide; bottom: number; onClose: () => void }) {
  const steps = installSteps(kind);
  const [copied, setCopied] = useState(false);
  const sheet = (
    <View style={styles.overlay} accessibilityViewIsModal accessibilityLabel="Add to Home Screen">
      <Pressable accessibilityRole="button" accessibilityLabel="Close install steps" style={styles.backdrop} onPress={onClose} />
      <Glass tone="dark" style={[styles.sheet, { marginBottom: Math.max(bottom, 16), backgroundColor: "rgba(7,27,42,0.62)" }]}>
        <T variant="eyebrow" color={colors.gold}>Home Screen</T>
        <T variant="title" color={colors.ivory}>Add TATEL</T>
        {steps.map((step) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.mark}>
              <StepIcon name={step.icon} />
            </View>
            <View style={styles.stepCopy}>
              <T variant="rowTitle" color={colors.ivory}>{step.title}</T>
              <T variant="meta" color={colors.onDarkSoft}>{step.body}</T>
            </View>
          </View>
        ))}
        {installOffersCopy(kind) ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Copy link" onPress={() => copyPageLink().then(() => setCopied(true)).catch(() => undefined)} style={styles.copy}>
            <T variant="button" color={colors.gold}>{copied ? "Copied" : "Copy link"}</T>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.done}>
          <T variant="button" color={colors.ink}>Done</T>
        </Pressable>
      </Glass>
    </View>
  );
  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

async function copyPageLink(): Promise<void> {
  const href = window.location.href;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(href);
    return;
  }
  const input = document.createElement("textarea");
  input.value = href;
  input.setAttribute("readonly", "true");
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function StepIcon({ name }: { name: InstallIcon }) {
  const stroke = { stroke: colors.gold, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" as const };
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {name === "share" ? <Path {...stroke} d="M12 16V4M8 8l4-4 4 4M6 13v6h12v-6" /> : null}
      {name === "plus" ? <Path {...stroke} d="M5 4h14v16H5zM12 8v8M8 12h8" /> : null}
      {name === "menu" ? <Path {...stroke} d="M5 7h14M5 12h14M5 17h14" /> : null}
      {name === "safari" ? <Path {...stroke} d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5Z" /> : null}
      {name === "copy" ? (
        <>
          <Rect {...stroke} x={8} y={8} width={11} height={12} rx={2} />
          <Path {...stroke} d="M6 16V6a2 2 0 0 1 2-2h8" />
        </>
      ) : null}
    </Svg>
  );
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  pill: {
    ...nightGlass,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 44,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  add: { flexShrink: 1, minHeight: 44, justifyContent: "center" },
  dismiss: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  overlay: {
    ...fixed,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 90,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(6,14,24,0.45)",
  },
  sheet: {
    marginHorizontal: 12,
    gap: 12,
    borderRadius: 22,
  },
  step: { flexDirection: "row", gap: 12, alignItems: "center" },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,224,138,0.55)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  stepCopy: { flex: 1, gap: 2 },
  copy: {
    minHeight: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gold,
  },
  done: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
});
