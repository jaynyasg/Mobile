export function displayCopy(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/\b[Pp]roposed\s+/g, "")
    .replace(/\b(?:keynote\s+)?topic to be announced\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,])/g, "$1")
    .trim();
}

export const SPEAKER_TBA = "Speaker to be announced";
export const VENUE_TBC = "Venue: to be confirmed";
