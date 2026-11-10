export function displayCopy(value: string | null | undefined): string {
  return (value ?? "").replace(/\b[Pp]roposed\s+/g, "");
}

export const SPEAKER_TBA = "Speaker to be announced";
export const VENUE_TBC = "Venue: to be confirmed";
