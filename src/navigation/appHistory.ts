import type { Href } from "expo-router";

/**
 * In-app back stack. Standalone iPhone has no browser back button, and
 * expo-router often reports that it cannot go back even when the person
 * came from another screen.
 */

const paths: string[] = [];
let skipNext = false;
const closers: Array<() => void> = [];

export function resetAppHistory(): void {
  paths.length = 0;
  skipNext = false;
  closers.length = 0;
}

export function notePath(path: string): void {
  if (!path) return;
  if (skipNext) {
    skipNext = false;
    return;
  }
  if (paths[paths.length - 1] === path) return;
  paths.push(path);
  if (paths.length > 40) paths.shift();
}

export function previousPath(): string | null {
  return paths.length > 1 ? paths[paths.length - 2] : null;
}

export function popPath(): string | null {
  if (paths.length < 2) return null;
  paths.pop();
  skipNext = true;
  return paths[paths.length - 1] ?? null;
}

export function registerOverlay(close: () => void): () => void {
  closers.push(close);
  return () => {
    const index = closers.lastIndexOf(close);
    if (index >= 0) closers.splice(index, 1);
  };
}

export function closeTopOverlay(): boolean {
  const close = closers.pop();
  if (!close) return false;
  close();
  return true;
}

export function goAppBack(router: { replace: (href: Href) => void; back: () => void; canGoBack: () => boolean }): void {
  if (closeTopOverlay()) return;
  const prev = popPath();
  if (prev) {
    router.replace(prev as Href);
    return;
  }
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/");
}
