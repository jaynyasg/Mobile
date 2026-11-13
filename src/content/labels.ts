/** Visitor-facing edition name. The retired edition word is shown as Sessions. */
export function visitorEdition(edition: string): string {
  return edition.trim().toLowerCase() === "conversations" ? "Sessions" : edition;
}

export function islandTrackLabel(island: string, track: string): string {
  return joinLine([island, track]);
}

/** Join the parts that exist. An empty company must not leave a trailing " · ". */
export function joinLine(parts: Array<string | null | undefined>): string {
  return parts.map((part) => part?.trim() ?? "").filter(Boolean).join(" · ");
}
