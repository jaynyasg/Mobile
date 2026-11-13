export interface DialCountry {
  id: string;
  name: string;
  dial: string;
  nationalMin: number;
  nationalMax: number;
}

export const DIAL_COUNTRIES: DialCountry[] = [
  { id: "us", name: "United States", dial: "1", nationalMin: 10, nationalMax: 10 },
  { id: "usvi", name: "US Virgin Islands", dial: "1", nationalMin: 10, nationalMax: 10 },
  { id: "bvi", name: "British Virgin Islands", dial: "1", nationalMin: 10, nationalMax: 10 },
  { id: "ca", name: "Canada", dial: "1", nationalMin: 10, nationalMax: 10 },
  { id: "pr", name: "Puerto Rico", dial: "1", nationalMin: 10, nationalMax: 10 },
  { id: "jm", name: "Jamaica", dial: "1", nationalMin: 10, nationalMax: 10 },
  { id: "do", name: "Dominican Republic", dial: "1", nationalMin: 10, nationalMax: 10 },
  { id: "gb", name: "United Kingdom", dial: "44", nationalMin: 10, nationalMax: 10 },
  { id: "mx", name: "Mexico", dial: "52", nationalMin: 10, nationalMax: 10 },
  { id: "fr", name: "France", dial: "33", nationalMin: 9, nationalMax: 9 },
];

export const DEFAULT_COUNTRY_ID = "us";

export function countryById(id: string): DialCountry {
  return DIAL_COUNTRIES.find((country) => country.id === id) ?? DIAL_COUNTRIES[0];
}

export function nationalDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/** E.164, or null when the national number does not fit the selected country. */
export function toE164(country: DialCountry, input: string): string | null {
  let digits = nationalDigits(input);
  if (digits.startsWith(country.dial)) {
    const rest = digits.slice(country.dial.length);
    if (rest.length >= country.nationalMin && rest.length <= country.nationalMax) digits = rest;
  }
  if (digits.length < country.nationalMin || digits.length > country.nationalMax) return null;
  const e164 = `+${country.dial}${digits}`;
  if (!/^\+[1-9]\d{7,14}$/.test(e164)) return null;
  return e164;
}
