export type InstallChoice =
  | "hide"
  | "prompt"
  | "ios-safari"
  | "ios-chrome"
  | "ios-firefox"
  | "ios-edge"
  | "ios-other"
  | "ios-legacy"
  | "ios-inapp"
  | "menu";

export type InstallIcon = "share" | "plus" | "menu" | "safari" | "copy";

export interface InstallStep {
  icon: InstallIcon;
  title: string;
  body: string;
}

export const INSTALL_DISMISS_KEY = "tatel.install.dismissedUntil";
/** Two weeks. Close and Done both use this. */
export const INSTALL_DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

export interface InstallContext {
  userAgent: string;
  displayModeStandalone: boolean;
  navigatorStandalone: boolean;
  maxTouchPoints?: number;
  hasPrompt: boolean;
}

export interface InstallPromptEvent {
  preventDefault: () => void;
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PromptHost {
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  removeEventListener: (type: string, listener: (event: Event) => void) => void;
}

const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|GSA\/|Gmail|GoogleApp|Line\/|MicroMessenger|Snapchat|Twitter|LinkedInApp|Bytedance|musical_ly|TikTok|Pinterest|Slack\/|WhatsApp|Telegram|Discord|Reddit\/|KAKAOTALK|NAVER|IABMV/i;

export function installChoice(input: InstallContext): InstallChoice {
  if (input.displayModeStandalone || input.navigatorStandalone) return "hide";
  if (input.hasPrompt) return "prompt";
  if (!isIos(input.userAgent, input.maxTouchPoints ?? 0)) return "menu";
  if (isInAppBrowser(input.userAgent)) return "ios-inapp";
  const browser = iosBrowser(input.userAgent);
  if (browser === "safari") return "ios-safari";
  if (!iosSupportsHomeScreen(input.userAgent)) return "ios-legacy";
  if (browser === "chrome") return "ios-chrome";
  if (browser === "firefox") return "ios-firefox";
  if (browser === "edge") return "ios-edge";
  return "ios-other";
}

export function installOffersCopy(choice: InstallChoice): boolean {
  return choice === "ios-inapp" || choice === "ios-legacy";
}

export function installHiddenUntil(stored: string | null, now: number): boolean {
  const until = Number(stored);
  return Number.isFinite(until) && until > now;
}

export function rememberInstallDismiss(now: number, span = INSTALL_DISMISS_MS): string {
  return String(now + span);
}

export function installSteps(choice: InstallChoice): InstallStep[] {
  return stepsFor(choice);
}

function stepsFor(choice: InstallChoice): InstallStep[] {
  if (choice === "ios-safari") {
    return [
      { icon: "share", title: "Tap Share", body: "In Safari, tap the Share button in the bottom bar. It is the square with an arrow pointing up." },
      { icon: "plus", title: "Add to Home Screen", body: "Scroll the share sheet and tap Add to Home Screen." },
      { icon: "plus", title: "Tap Add", body: "TATEL then opens from its own icon, full screen." },
    ];
  }
  if (choice === "ios-chrome") {
    return [
      { icon: "share", title: "Tap Share", body: "In Chrome, tap the Share icon in the address bar, to the right of tatel.app. It is the square with an arrow." },
      { icon: "plus", title: "Add to Home Screen", body: "Scroll the share sheet until you see Add to Home Screen, then tap it." },
      { icon: "plus", title: "Tap Add", body: "Chrome on iOS 16.4 and later can add TATEL without opening Safari." },
    ];
  }
  if (choice === "ios-firefox") {
    return [
      { icon: "menu", title: "Open Share", body: "In Firefox, tap the menu button at the bottom of the screen (three lines), then tap Share." },
      { icon: "plus", title: "Add to Home Screen", body: "Scroll the share sheet and tap Add to Home Screen, then Add." },
    ];
  }
  if (choice === "ios-edge") {
    return [
      { icon: "share", title: "Tap Share", body: "In Edge, tap the Share icon at the bottom of the screen. If you only see …, tap that, then Share." },
      { icon: "plus", title: "Add to Home Screen", body: "Scroll the share sheet and tap Add to Home Screen, then Add." },
    ];
  }
  if (choice === "ios-other") {
    return [
      { icon: "share", title: "Tap Share", body: "Use this browser's Share button. On iOS 16.4 and later it can add a Home Screen icon." },
      { icon: "plus", title: "Add to Home Screen", body: "Scroll the share sheet and tap Add to Home Screen, then Add." },
    ];
  }
  if (choice === "ios-inapp") {
    return [
      { icon: "safari", title: "Open Safari", body: "This page is inside another app. Instagram, Facebook, Gmail, and similar browsers cannot add a Home Screen icon." },
      { icon: "copy", title: "Copy the link", body: "Copy this link, open Safari, paste it, then use the bottom Share button and Add to Home Screen." },
    ];
  }
  if (choice === "ios-legacy") {
    return [
      { icon: "safari", title: "Open Safari", body: "This iOS version can only add to the Home Screen from Safari." },
      { icon: "copy", title: "Copy the link", body: "Copy this link, open it in Safari, then tap the bottom Share button and Add to Home Screen." },
    ];
  }
  return [
    { icon: "menu", title: "Open the browser menu", body: "In Chrome or Edge, open the menu." },
    { icon: "plus", title: "Install the app", body: "Choose Install app or Add to Home screen." },
  ];
}

function isIos(userAgent: string, maxTouchPoints: number): boolean {
  if (/iphone|ipad|ipod/i.test(userAgent)) return true;
  return /macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

function isInAppBrowser(userAgent: string): boolean {
  if (IN_APP.test(userAgent)) return true;
  if (!/iphone|ipad|ipod/i.test(userAgent)) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|OPT\/|Safari/i.test(userAgent);
}

function iosBrowser(userAgent: string): "safari" | "chrome" | "firefox" | "edge" | "other" {
  if (/CriOS/i.test(userAgent)) return "chrome";
  if (/FxiOS/i.test(userAgent)) return "firefox";
  if (/EdgiOS/i.test(userAgent)) return "edge";
  if (/OPiOS|DuckDuckGo|OPT\//i.test(userAgent)) return "other";
  if (/Safari/i.test(userAgent)) return "safari";
  return "other";
}

/** Third-party browsers gained Add to Home Screen in iOS 16.4. Unknown versions are treated as current. */
export function iosSupportsHomeScreen(userAgent: string): boolean {
  const match = userAgent.match(/(?:iPhone OS|CPU OS)[ _](\d+)[_.](\d+)/);
  if (!match) return true;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > 16 || (major === 16 && minor >= 4);
}

let current: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let detach: (() => void) | null = null;

export function getInstallPrompt(): InstallPromptEvent | null {
  return current;
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publish(next: InstallPromptEvent | null) {
  current = next;
  for (const listener of listeners) listener();
}

export function acceptInstallPrompt(event: InstallPromptEvent) {
  event.preventDefault();
  publish(event);
}

export function clearInstallPrompt() {
  publish(null);
}

export function bindInstallPrompt(host: PromptHost): () => void {
  const onPrompt = (event: Event) => acceptInstallPrompt(event as unknown as InstallPromptEvent);
  const onInstalled = () => clearInstallPrompt();
  host.addEventListener("beforeinstallprompt", onPrompt);
  host.addEventListener("appinstalled", onInstalled);
  return () => {
    host.removeEventListener("beforeinstallprompt", onPrompt);
    host.removeEventListener("appinstalled", onInstalled);
  };
}

export function listenForInstallPrompt(host: PromptHost | null = typeof window === "undefined" ? null : window): void {
  if (!host || detach) return;
  detach = bindInstallPrompt(host);
}
