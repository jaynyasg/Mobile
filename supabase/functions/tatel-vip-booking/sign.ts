/** Public key for worker requests. The matching private key stays in VIP_SIGNING_PRIVATE_KEY. */
export const VIP_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAYnpK1W3e8qbvqdSGxYKHOQcUAS+Lx1Kp+4qYaJuVv9o=
-----END PUBLIC KEY-----`;

export const VIP_SIGN_WINDOW_MS = 5 * 60 * 1000;

export async function vipCanonical(timestamp: string, method: string, path: string, body: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${timestamp}.${method.toUpperCase()}.${path}.${hash}`;
}

export async function signVipRequest(privateKeyPem: string, timestamp: string, method: string, path: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("pkcs8", pemBytes(privateKeyPem), { name: "Ed25519" }, false, ["sign"]);
  const data = new TextEncoder().encode(await vipCanonical(timestamp, method, path, body));
  const signature = await crypto.subtle.sign({ name: "Ed25519" }, key, data);
  return base64url(new Uint8Array(signature));
}

export async function verifyVipRequest(
  publicKeyPem: string,
  timestamp: string,
  method: string,
  path: string,
  body: string,
  signature: string,
  now = Date.now(),
): Promise<boolean> {
  const sent = Number(timestamp);
  if (!timestamp || !signature || !Number.isFinite(sent)) return false;
  if (Math.abs(now - sent) > VIP_SIGN_WINDOW_MS) return false;
  const raw = base64urlBytes(signature);
  if (!raw) return false;
  try {
    const key = await crypto.subtle.importKey("spki", pemBytes(publicKeyPem), { name: "Ed25519" }, false, ["verify"]);
    const data = new TextEncoder().encode(await vipCanonical(timestamp, method, path, body));
    return crypto.subtle.verify({ name: "Ed25519" }, key, raw, data);
  } catch {
    return false;
  }
}

function pemBytes(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, "");
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlBytes(value: string): ArrayBuffer | null {
  try {
    const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return buffer;
  } catch {
    return null;
  }
}
