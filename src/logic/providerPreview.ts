const OWN_SITE_ONLY = new Set(["igymarinas.com", "ritzcarltonyachtcollection.com", "voyagecharters.com", "scrubisland.com", "marriott.com"]);
export function canConfirmStay(section: string, provider: { name: string; href: string | null }): boolean {
  return !/boat/i.test(section) && !/Explore BVI/.test(provider.name) && !provider.href?.includes("/beach-club/");
}
/** Same provider-window approach as the TATEL website. */
export function providerPreview(href: string): { href: string; host: string; embedded: boolean } | null {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" || url.username || url.password || url.hostname === "localhost" || url.hostname.endsWith(".localhost") || url.hostname.startsWith("[") || /^\d+\./.test(url.hostname)) return null;
    const host = url.hostname.replace(/^www\./, "");
    if (host === "tatel.app" || host.endsWith(".tatel.app")) return null;
    return { href: url.href, host, embedded: ![...OWN_SITE_ONLY].some(domain => host === domain || host.endsWith(`.${domain}`)) };
  } catch { return null; }
}
