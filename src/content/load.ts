import type { ProgramData } from "./types";
import { parseContent } from "./schema";

export type ContentSource = "bundle" | "cache" | "remote";

export const CONTENT_CACHE_KEY = "tatel.content.v1";

export async function resolveContent(options: {
  bundle: ProgramData;
  url?: string;
  fallbackUrl?: string;
  fetchImpl?: typeof fetch;
  readCache: () => Promise<unknown>;
  writeCache: (program: ProgramData) => Promise<void>;
}): Promise<{ program: ProgramData; source: ContentSource }> {
  let program = options.bundle;
  let source: ContentSource = "bundle";
  try {
    const cached = await options.readCache();
    const parsed = cached ? parseContent(cached, options.bundle) : null;
    if (parsed?.ok) {
      program = parsed.program;
      source = "cache";
    }
  } catch {
    // A broken cache falls through to the bundle or the network.
  }

  const urls = [options.url, options.fallbackUrl].flatMap((value) => {
    const trimmed = value?.trim();
    return trimmed ? [trimmed] : [];
  });
  const fetchImpl = options.fetchImpl ?? fetch;
  for (const url of urls) {
    try {
      const response = await fetchImpl(url);
      if (!response.ok) continue;
      const body: unknown = await response.json();
      const parsed = parseContent(body, program);
      if (!parsed.ok) continue;
      await options.writeCache(parsed.program);
      return { program: parsed.program, source: "remote" };
    } catch {
      // Try the next URL, then the cache or the bundled copy.
    }
  }
  return { program, source };
}
