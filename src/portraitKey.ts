/** SVG stand-ins in the published roster, not photographs. */
const PLACEHOLDERS = new Set(["charlie-brown-placeholder", "antonette-boynes-usvi"]);

/** Basename stem for a program photo path, or null when there is no photograph. */
export function portraitKey(photo?: string | null): string | null {
  if (!photo) return null;
  const file = photo.split("/").pop()?.split("?")[0] ?? "";
  if (!file || file.toLowerCase().endsWith(".svg")) return null;
  const stem = file.replace(/\.[^.]+$/, "");
  if (!stem || PLACEHOLDERS.has(stem)) return null;
  return stem;
}
