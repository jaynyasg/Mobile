const TYPES: Record<string, string> = {
  "/manifest.webmanifest": "application/manifest+json",
  "/sw.js": "text/javascript",
  "/apple-touch-icon.png": "image/png",
  "/favicon.ico": "image/x-icon",
};

export const MANIFEST_LINK = '</manifest.webmanifest>; rel="manifest"';

/** Manifest and icons must not fall through to the HTML shell. */
export function pwaContentType(pathname: string): string | null {
  const path = pathname.toLowerCase();
  if (TYPES[path]) return TYPES[path];
  if (path.startsWith("/icons/") && path.endsWith(".png")) return "image/png";
  return null;
}

export function isHtmlShell(response: { headers: { get(name: string): string | null } }): boolean {
  return (response.headers.get("Content-Type") ?? "").toLowerCase().includes("text/html");
}

function hasMeta(html: string, name: string): boolean {
  return new RegExp(`<meta\\s+[^>]*name=["']${name}["']`, "i").test(html);
}

/** Every HTML response keeps the install tags, including client routes. */
export function ensurePwaDocument(html: string): string {
  const tags: string[] = [];
  if (!/rel=["']manifest["']/i.test(html)) tags.push('<link rel="manifest" href="/manifest.webmanifest" />');
  if (!hasMeta(html, "apple-mobile-web-app-capable")) tags.push('<meta name="apple-mobile-web-app-capable" content="yes" />');
  if (!hasMeta(html, "mobile-web-app-capable")) tags.push('<meta name="mobile-web-app-capable" content="yes" />');
  if (!hasMeta(html, "apple-mobile-web-app-status-bar-style")) tags.push('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />');
  if (!hasMeta(html, "apple-mobile-web-app-title")) tags.push('<meta name="apple-mobile-web-app-title" content="TATEL" />');
  if (!hasMeta(html, "theme-color")) tags.push('<meta name="theme-color" content="#071B2A" />');
  if (!/rel=["']apple-touch-icon["']/i.test(html)) tags.push('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />');
  if (!tags.length) return html;
  const block = tags.join("\n");
  if (html.includes("</head>")) return html.replace("</head>", `${block}\n</head>`);
  return `${block}\n${html}`;
}

export interface InstallManifest {
  name?: string;
  short_name?: string;
  id?: string;
  start_url?: string;
  scope?: string;
  display?: string;
  background_color?: string;
  theme_color?: string;
  prefer_related_applications?: boolean;
  icons?: { src?: string; sizes?: string; type?: string; purpose?: string }[];
}

/** Gaps that stop Chrome from firing beforeinstallprompt and installing a WebAPK. */
export function installabilityGaps(manifest: InstallManifest, serviceWorker: string): string[] {
  const gaps: string[] = [];
  if (!manifest.name && !manifest.short_name) gaps.push("name");
  if (!manifest.id) gaps.push("id");
  if (!manifest.start_url?.startsWith("https://tatel.app/")) gaps.push("start_url");
  if (!manifest.scope?.startsWith("https://tatel.app/")) gaps.push("scope");
  if (manifest.display !== "standalone" && manifest.display !== "fullscreen") gaps.push("display");
  if (!manifest.theme_color || manifest.theme_color !== manifest.background_color) gaps.push("theme");
  if (manifest.prefer_related_applications === true) gaps.push("prefer_related_applications");
  const icons = manifest.icons ?? [];
  const sized = (size: string, purpose: "any" | "maskable") => icons.some((icon) => {
    const sizes = (icon.sizes ?? "").split(/\s+/);
    const purposes = (icon.purpose ?? "any").split(/\s+/);
    return Boolean(icon.src) && sizes.includes(size) && purposes.includes(purpose) && (icon.type === "image/png" || icon.src?.endsWith(".png"));
  });
  if (!sized("192x192", "any")) gaps.push("icon-192");
  if (!sized("512x512", "any")) gaps.push("icon-512");
  if (!sized("192x192", "maskable")) gaps.push("maskable-192");
  if (!sized("512x512", "maskable")) gaps.push("maskable-512");
  if (!/addEventListener\(\s*["']fetch["']/.test(serviceWorker)) gaps.push("fetch");
  if (!/caches\.match\(\s*["']\/index\.html["']/.test(serviceWorker)) gaps.push("offline");
  if (!/clients\.claim\(/.test(serviceWorker)) gaps.push("claim");
  return gaps;
}
