/** Keep taps inside the installed app. Outside pages open in a new tab. */

export function isExternalHref(href: string, origin = "https://tatel.app"): boolean {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (href.startsWith("/") || href.startsWith("?")) return false;
  try {
    const url = new URL(href, origin);
    return url.origin !== origin;
  } catch {
    return false;
  }
}

export type ClickPlan = "ignore" | "inside" | "external";

export function clickPlan(href: string, origin: string): ClickPlan {
  if (!href || href.startsWith("#")) return "ignore";
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return "external";
  return isExternalHref(href, origin) ? "external" : "inside";
}

export function openExternal(url: string): void {
  if (typeof window === "undefined") return;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
}

export function installLinkGuard(): () => void {
  if (typeof document === "undefined") return () => undefined;
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a[href]");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    const plan = clickPlan(href, window.location.origin);
    if (plan === "ignore") return;
    event.preventDefault();
    if (plan === "external") {
      event.stopPropagation();
      const url = href.startsWith("mailto:") || href.startsWith("tel:") ? href : new URL(href, window.location.origin).href;
      openExternal(url);
    }
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
