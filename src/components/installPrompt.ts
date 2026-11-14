export type InstallChoice = "hide" | "prompt" | "ios-safari" | "ios-browser" | "menu";

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

export function installChoice(input: InstallContext): InstallChoice {
  if (input.displayModeStandalone || input.navigatorStandalone) return "hide";
  if (input.hasPrompt) return "prompt";
  if (!isIos(input.userAgent, input.maxTouchPoints ?? 0)) return "menu";
  return isIosSafari(input.userAgent) ? "ios-safari" : "ios-browser";
}

function isIos(userAgent: string, maxTouchPoints: number): boolean {
  if (/iphone|ipad|ipod/i.test(userAgent)) return true;
  return /macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

function isIosSafari(userAgent: string): boolean {
  return /safari/i.test(userAgent) && !/crios|fxios|edgios|opios/i.test(userAgent);
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
