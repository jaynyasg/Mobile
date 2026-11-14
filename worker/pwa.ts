const TYPES: Record<string, string> = {
  "/manifest.webmanifest": "application/manifest+json",
  "/apple-touch-icon.png": "image/png",
  "/favicon.ico": "image/x-icon",
};

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
