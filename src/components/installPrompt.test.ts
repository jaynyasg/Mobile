import { beforeEach, describe, expect, it } from "vitest";
import {
  acceptInstallPrompt,
  bindInstallPrompt,
  clearInstallPrompt,
  getInstallPrompt,
  installChoice,
  installHiddenUntil,
  installOffersCopy,
  installSteps,
  iosSupportsHomeScreen,
  rememberInstallDismiss,
  subscribeInstallPrompt,
  INSTALL_DISMISS_MS,
  type InstallPromptEvent,
} from "./installPrompt";

const safari = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const chromeIos = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.108 Mobile/15E148 Safari/604.1";
const firefoxIos = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15";
const edgeIos = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/126.0.2592.108 Version/17.0 Mobile/15E148 Safari/604.1";
const chrome = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const edge = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";
const ipadDesktop = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

function context(partial: Partial<Parameters<typeof installChoice>[0]> = {}) {
  return {
    userAgent: chrome,
    displayModeStandalone: false,
    navigatorStandalone: false,
    maxTouchPoints: 0,
    hasPrompt: false,
    ...partial,
  };
}

describe("install choice", () => {
  it("hides the control when the app is already standalone", () => {
    expect(installChoice(context({ displayModeStandalone: true, hasPrompt: true }))).toBe("hide");
    expect(installChoice(context({ userAgent: safari, navigatorStandalone: true }))).toBe("hide");
  });

  it("uses a saved browser prompt before any instructions", () => {
    expect(installChoice(context({ hasPrompt: true }))).toBe("prompt");
    expect(installChoice(context({ userAgent: safari, hasPrompt: true }))).toBe("prompt");
  });

  it("shows Safari steps on iPhone and iPad Safari, including desktop-mode iPad", () => {
    expect(installChoice(context({ userAgent: safari }))).toBe("ios-safari");
    expect(installChoice(context({ userAgent: ipadDesktop, maxTouchPoints: 5 }))).toBe("ios-safari");
  });

  it("gives Chrome, Firefox, and Edge on iOS 16.4+ their own Share steps", () => {
    expect(installChoice(context({ userAgent: chromeIos }))).toBe("ios-chrome");
    expect(installChoice(context({ userAgent: firefoxIos }))).toBe("ios-firefox");
    expect(installChoice(context({ userAgent: edgeIos }))).toBe("ios-edge");
    expect(installSteps("ios-chrome").map((step) => step.body).join(" ")).toMatch(/address bar/i);
    expect(installSteps("ios-chrome").map((step) => step.body).join(" ")).toMatch(/Add to Home Screen/);
    expect(installSteps("ios-safari").map((step) => step.body).join(" ")).toMatch(/bottom bar/i);
    expect(installSteps("ios-firefox").map((step) => step.body).join(" ")).toMatch(/menu button/i);
    expect(installSteps("ios-edge").map((step) => step.body).join(" ")).toMatch(/bottom/i);
    expect(installSteps("ios-chrome").map((step) => step.body).join(" ")).not.toMatch(/conversation/i);
  });

  it("sends older iOS browsers and in-app browsers to Safari with a copy step", () => {
    const chrome15 = chromeIos.replace("17_5", "15_6");
    const chrome163 = chromeIos.replace("17_5", "16_3");
    const instagram = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 340.0.0.0.0";
    const facebook = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/500.0.0.0.0;]";
    const gmail = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
    expect(iosSupportsHomeScreen(chromeIos)).toBe(true);
    expect(iosSupportsHomeScreen(chrome163)).toBe(false);
    expect(installChoice(context({ userAgent: chrome15 }))).toBe("ios-legacy");
    expect(installChoice(context({ userAgent: instagram }))).toBe("ios-inapp");
    expect(installChoice(context({ userAgent: facebook }))).toBe("ios-inapp");
    expect(installChoice(context({ userAgent: gmail }))).toBe("ios-inapp");
    expect(installOffersCopy("ios-inapp")).toBe(true);
    expect(installOffersCopy("ios-legacy")).toBe(true);
    expect(installOffersCopy("ios-chrome")).toBe(false);
    expect(installSteps("ios-inapp").map((step) => step.body).join(" ")).toMatch(/Safari/);
    expect(installSteps("ios-inapp").some((step) => step.icon === "copy")).toBe(true);
  });

  it("remembers a dismiss for two weeks", () => {
    const now = Date.parse("2026-11-14T00:00:00Z");
    const stored = rememberInstallDismiss(now);
    expect(Number(stored) - now).toBe(INSTALL_DISMISS_MS);
    expect(installHiddenUntil(stored, now + 1000)).toBe(true);
    expect(installHiddenUntil(stored, now + INSTALL_DISMISS_MS + 1)).toBe(false);
    expect(installHiddenUntil(null, now)).toBe(false);
  });

  it("opens a menu guide when Chromium has no deferred prompt", () => {
    expect(installChoice(context({ userAgent: chrome }))).toBe("menu");
    expect(installChoice(context({ userAgent: edge }))).toBe("menu");
    expect(installChoice(context({ userAgent: ipadDesktop, maxTouchPoints: 0 }))).toBe("menu");
  });
});

describe("install prompt store", () => {
  beforeEach(() => {
    clearInstallPrompt();
  });

  it("prevents the default banner, stores the event, and clears it once the app is installed", () => {
    const seen: Array<InstallPromptEvent | null> = [];
    const stop = subscribeInstallPrompt(() => seen.push(getInstallPrompt()));
    const listeners = new Map<string, (event: Event) => void>();
    const host = {
      addEventListener: (type: string, listener: (event: Event) => void) => listeners.set(type, listener),
      removeEventListener: (type: string) => listeners.delete(type),
    };
    const release = bindInstallPrompt(host);
    let prevented = false;
    const event = {
      preventDefault: () => {
        prevented = true;
      },
      prompt: () => Promise.resolve(),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    };
    listeners.get("beforeinstallprompt")?.(event as unknown as Event);
    expect(prevented).toBe(true);
    expect(getInstallPrompt()).toBe(event);
    listeners.get("appinstalled")?.({} as Event);
    expect(getInstallPrompt()).toBeNull();
    expect(seen).toEqual([event, null]);
    release();
    stop();
  });

  it("stores a prompt that arrives before a subscriber attaches", () => {
    const event = {
      preventDefault: () => undefined,
      prompt: () => Promise.resolve(),
      userChoice: Promise.resolve({ outcome: "dismissed" as const }),
    };
    acceptInstallPrompt(event);
    expect(getInstallPrompt()).toBe(event);
  });
});
