import { describe, expect, it } from "vitest";
import { VIP_PUBLIC_KEY_PEM, VIP_SIGN_WINDOW_MS, signVipRequest, verifyVipRequest } from "./sign";

const NOW = Date.parse("2026-11-14T04:27:00.000Z");
const PATH = "/functions/v1/tatel-vip-booking";
const BODY = JSON.stringify({ action: "get", payload: { code: "boatcode01" } });

describe("VIP request signatures", () => {
  it("accepts a fresh signature and rejects a tampered body or a stale timestamp", async () => {
    const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
    const privateKey = wrap("PRIVATE KEY", await crypto.subtle.exportKey("pkcs8", pair.privateKey));
    const publicKey = wrap("PUBLIC KEY", await crypto.subtle.exportKey("spki", pair.publicKey));
    const timestamp = String(NOW);
    const signature = await signVipRequest(privateKey, timestamp, "POST", PATH, BODY);
    expect(await verifyVipRequest(publicKey, timestamp, "POST", PATH, BODY, signature, NOW)).toBe(true);
    expect(await verifyVipRequest(publicKey, timestamp, "POST", PATH, `${BODY} `, signature, NOW)).toBe(false);
    const stale = String(NOW - VIP_SIGN_WINDOW_MS - 1);
    const staleSignature = await signVipRequest(privateKey, stale, "POST", PATH, BODY);
    expect(await verifyVipRequest(publicKey, stale, "POST", PATH, BODY, staleSignature, NOW)).toBe(false);
    expect(await verifyVipRequest(publicKey, timestamp, "POST", PATH, BODY, "", NOW)).toBe(false);
    expect(await verifyVipRequest(VIP_PUBLIC_KEY_PEM, timestamp, "POST", PATH, BODY, signature, NOW)).toBe(false);
  });
});

function wrap(label: string, key: ArrayBuffer): string {
  const bytes = new Uint8Array(key);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const b64 = btoa(binary).replace(/(.{64})/g, "$1\n");
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----`;
}
