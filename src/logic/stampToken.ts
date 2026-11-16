/** Island stamp codes. The worker secret never lives in the client bundle. */

export const STAMP_ISLANDS = ["tech", "ai", "travel", "entertainment", "law"] as const;
export type StampIslandId = (typeof STAMP_ISLANDS)[number];

const PAYLOAD_PREFIX = "tatel-stamp-v1:";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function stampMessage(islandId: string): string {
  return `${PAYLOAD_PREFIX}${islandId}`;
}

export function isStampIsland(value: string): value is StampIslandId {
  return (STAMP_ISLANDS as readonly string[]).includes(value);
}

export async function stampMac(secret: string, islandId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const raw = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(stampMessage(islandId)));
  return [...new Uint8Array(raw)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Full token for the QR. islandId plus the hex MAC. */
export async function stampToken(secret: string, islandId: StampIslandId): Promise<string> {
  return `${islandId}.${await stampMac(secret, islandId)}`;
}

/** Eight letters a person can type if the camera will not open. */
export async function stampShortCode(secret: string, islandId: StampIslandId): Promise<string> {
  const hex = await stampMac(secret, islandId);
  let body = "";
  for (let i = 0; i < 8; i += 1) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    body += ALPHABET[byte % ALPHABET.length];
  }
  return `${islandId.slice(0, 4).toUpperCase()}-${body}`;
}

function same(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

/** Returns the island id when the QR token or the short code matches. */
export async function verifyStampCode(secret: string, code: string): Promise<StampIslandId | null> {
  const trimmed = code.trim();
  if (!secret || !trimmed) return null;
  const token = trimmed.includes(".") ? trimmed : "";
  if (token) {
    const [island, mac] = token.split(".");
    if (!island || !mac || !isStampIsland(island)) return null;
    const expected = await stampMac(secret, island);
    return same(expected, mac.toLowerCase()) ? island : null;
  }
  const typed = trimmed.toUpperCase().replace(/\s+/g, "");
  for (const island of STAMP_ISLANDS) {
    const short = (await stampShortCode(secret, island)).toUpperCase();
    if (same(short, typed)) return island;
  }
  return null;
}
