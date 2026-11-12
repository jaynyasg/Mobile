// Published Lovable site (project e06d93b5-2057-4f6f-9494-a9a198357d4a).
// The sitemap canonical URL is https://tatel.18seventy8.com/.
export const publishedProgramUrl = "https://tatel.18seventy8.com/tatel/downloads/tatel-2027-program.json";

// Same-origin route on https://tatel.app. The worker fetches the Lovable file.
export const programSyncPath = "/api/program";

export function programRequestUrls(input: { override?: string | null; origin?: string | null } = {}): {
  url: string;
  fallbackUrl?: string;
} {
  const override = input.override?.trim();
  if (override) return { url: override };
  if (!input.origin) return { url: publishedProgramUrl };
  let host = "";
  try {
    host = new URL(input.origin).hostname;
  } catch {
    return { url: publishedProgramUrl };
  }
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  return local ? { url: programSyncPath, fallbackUrl: publishedProgramUrl } : { url: programSyncPath };
}
