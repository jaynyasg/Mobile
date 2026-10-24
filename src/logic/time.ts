export interface ClockParts {
  time: string;
  daypart: string;
}

export function clockParts(iso: string, timeZone: string): ClockParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    time: `${pick("hour")}:${pick("minute")}`,
    daypart: pick("dayPeriod").toUpperCase(),
  };
}

export function zoneAbbrev(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    timeZoneName: "short",
  }).formatToParts(new Date(iso));
  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

export function formatRange(start: string, end: string, timeZone: string): string {
  const opening = clockParts(start, timeZone);
  const closing = clockParts(end, timeZone);
  const zone = zoneAbbrev(start, timeZone);
  if (opening.daypart === closing.daypart) {
    return `${opening.time} – ${closing.time} ${closing.daypart} ${zone}`;
  }
  return `${opening.time} ${opening.daypart} – ${closing.time} ${closing.daypart} ${zone}`;
}

export function formatStamp(iso: string, timeZone: string): string {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
  return `${date} ${zoneAbbrev(iso, timeZone)}`;
}

export function sameClock(iso: string, zoneA: string, zoneB: string): boolean {
  const a = clockParts(iso, zoneA);
  const b = clockParts(iso, zoneB);
  return a.time === b.time && a.daypart === b.daypart && zoneAbbrev(iso, zoneA) === zoneAbbrev(iso, zoneB);
}

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function ymd(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
