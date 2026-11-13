/** Visitor-facing edition name. The retired edition word is shown as Sessions. */
export function visitorEdition(edition: string): string {
  return edition.trim().toLowerCase() === "conversations" ? "Sessions" : edition;
}

export function islandTrackLabel(island: string, track: string): string {
  return `${island} · ${track}`;
}
