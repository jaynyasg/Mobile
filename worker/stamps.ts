import { STAMP_ISLANDS, stampShortCode, stampToken, verifyStampCode, type StampIslandId } from "../src/logic/stampToken";
import { clientKey, consumeRate, type RateBook } from "./quickSignin";

export interface StampEnv {
  STAMP_SIGNING_SECRET?: string;
}

const book: RateBook = { hits: new Map() };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function handleStampRequest(request: Request, env: StampEnv, now = Date.now()): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/stamps/verify" && url.pathname !== "/api/stamps/posters") return null;
  const secret = env.STAMP_SIGNING_SECRET ?? "";
  if (!secret) return json({ error: "Stamp signing is not configured." }, 404);

  if (url.pathname === "/api/stamps/posters") {
    if (request.method !== "GET") return json({ error: "Method" }, 405);
    const header = request.headers.get("x-stamp-admin") ?? "";
    if (header !== secret) return new Response("Not found", { status: 404 });
    const codes = await Promise.all(STAMP_ISLANDS.map(async (islandId) => ({
      islandId,
      token: await stampToken(secret, islandId),
      shortCode: await stampShortCode(secret, islandId),
    })));
    return json({ codes }, 200);
  }

  if (request.method !== "POST") return json({ error: "Method" }, 405);
  if (!consumeRate(book, `stamp:${clientKey(request)}`, now)) return json({ error: "Slow down and try the code again in a few minutes." }, 429);
  let code = "";
  try {
    const body = await request.json() as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    code = "";
  }
  const islandId: StampIslandId | null = await verifyStampCode(secret, code);
  if (!islandId) return json({ ok: false }, 401);
  return json({ ok: true, islandId }, 200);
}
