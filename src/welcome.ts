export const WELCOME_KEY = "tatel.welcomeSeen";

interface WelcomeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export function hasSeenWelcome(storage: WelcomeStorage | null): boolean {
  if (!storage) return false;
  return storage.getItem(WELCOME_KEY) === "1";
}

export function markWelcomeSeen(storage: WelcomeStorage | null): void {
  storage?.setItem(WELCOME_KEY, "1");
}

export function webStorage(): WelcomeStorage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}
