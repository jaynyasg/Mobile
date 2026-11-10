import type { ProgramData } from "./types";
import { parseContent } from "./schema";

export type ContentSource = "bundle" | "cache" | "remote";

export const CONTENT_CACHE_KEY = "tatel.content.v1";

export async function resolveContent(options: {
  bundle: ProgramData;
  url?: string;
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

  const url = options.url?.trim();
  if (!url) return { program, source };

  try {
    const response = await (options.fetchImpl ?? fetch)(url);
    if (!response.ok) throw new Error(String(response.status));
    const body: unknown = await response.json();
    const parsed = parseContent(body, program);
    if (!parsed.ok) throw new Error(parsed.error);
    await options.writeCache(parsed.program);
    return { program: parsed.program, source: "remote" };
  } catch {
    return { program, source };
  }
}
