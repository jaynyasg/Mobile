import { describe, expect, it } from "vitest";
import { FIREBASE_PROJECT_ID, SECURETOKEN_CERTS_URL, verifyFirebaseIdToken } from "./token";

function tlv(tag: number, content: number[]): number[] {
  const size = content.length;
  const length = size < 128 ? [size] : size < 256 ? [0x81, size] : [0x82, (size >> 8) & 0xff, size & 0xff];
  return [tag, ...length, ...content];
}

function sequence(content: number[]): number[] {
  return tlv(0x30, content);
}

function pem(der: Uint8Array): string {
  let binary = "";
  for (const byte of der) binary += String.fromCharCode(byte);
  return `-----BEGIN CERTIFICATE-----\n${btoa(binary)}\n-----END CERTIFICATE-----`;
}

function wrapCertificate(spki: Uint8Array): string {
  const tbs = sequence([
    ...tlv(0xa0, tlv(0x02, [2])),
    ...tlv(0x02, [1]),
    ...sequence([5, 0]),
    ...sequence([]),
    ...sequence([]),
    ...sequence([]),
    ...spki,
  ]);
  return pem(new Uint8Array(sequence([...tbs, ...sequence([5, 0]), ...tlv(0x03, [0])])));
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signedToken(payload: Record<string, unknown>, privateKey: CryptoKey, spki: Uint8Array) {
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", kid: "test" })));
  const body = base64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${header}.${body}`)));
  return { token: `${header}.${body}.${base64Url(signature)}`, cert: wrapCertificate(spki) };
}

const claims = {
  iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
  aud: FIREBASE_PROJECT_ID,
  exp: 2_000,
  sub: "firebase-user",
  phone_number: "+13405550100",
  firebase: { sign_in_provider: "phone" },
};

describe("Firebase ID token", () => {
  it("accepts a signed phone token and rejects a bad signature, issuer, or expiry", async () => {
    expect(SECURETOKEN_CERTS_URL).toBe("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
    const pair = await crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["sign", "verify"],
    );
    const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
    const good = await signedToken(claims, pair.privateKey, spki);
    const certs = { test: good.cert };
    expect(await verifyFirebaseIdToken(good.token, { now: 1_000, certs })).toEqual({ phone: "+13405550100", subject: "firebase-user" });

    const parts = good.token.split(".");
    const flipped = parts[2][8] === "A" ? "B" : "A";
    const broken = `${parts[0]}.${parts[1]}.${parts[2].slice(0, 8)}${flipped}${parts[2].slice(9)}`;
    expect(await verifyFirebaseIdToken(broken, { now: 1_000, certs })).toBeNull();
    const wrongIssuer = await signedToken({ ...claims, iss: "https://securetoken.google.com/other" }, pair.privateKey, spki);
    expect(await verifyFirebaseIdToken(wrongIssuer.token, { now: 1_000, certs: { test: wrongIssuer.cert } })).toBeNull();
    const expired = await signedToken({ ...claims, exp: 1 }, pair.privateKey, spki);
    expect(await verifyFirebaseIdToken(expired.token, { now: 5_000, certs: { test: expired.cert } })).toBeNull();
    const notPhone = await signedToken({ ...claims, firebase: { sign_in_provider: "password" } }, pair.privateKey, spki);
    expect(await verifyFirebaseIdToken(notPhone.token, { now: 1_000, certs: { test: notPhone.cert } })).toBeNull();
  });
});
