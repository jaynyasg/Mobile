export const FIREBASE_PROJECT_ID = "tatelapp";
export const SECURETOKEN_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export interface FirebasePhoneClaims {
  phone: string;
  subject: string;
}

interface DerNode {
  tag: number;
  start: number;
  end: number;
  children: DerNode[];
}

function readDer(bytes: Uint8Array, offset: number): DerNode {
  if (offset >= bytes.length) throw new Error("cert");
  const tag = bytes[offset];
  let length = bytes[offset + 1];
  let header = 2;
  if (length === undefined) throw new Error("cert");
  if (length & 0x80) {
    const count = length & 0x7f;
    if (count < 1 || count > 3) throw new Error("cert");
    length = 0;
    for (let index = 0; index < count; index += 1) length = (length << 8) | bytes[offset + 2 + index];
    header = 2 + count;
  }
  const contentStart = offset + header;
  const end = contentStart + length;
  if (end > bytes.length) throw new Error("cert");
  const children: DerNode[] = [];
  if ((tag & 0x20) !== 0) {
    let cursor = contentStart;
    while (cursor < end) {
      const child = readDer(bytes, cursor);
      children.push(child);
      cursor = child.end;
      if (children.length > 48) throw new Error("cert");
    }
  }
  return { tag, start: offset, end, children };
}

export function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN CERTIFICATE-----/g, "").replace(/-----END CERTIFICATE-----/g, "").replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function copyBytes(view: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(view.byteLength);
  new Uint8Array(copy).set(view);
  return copy;
}

export function spkiFromCertificate(pem: string): ArrayBuffer {
  const bytes = pemToDer(pem);
  const cert = readDer(bytes, 0);
  if (cert.tag !== 0x30 || cert.children.length < 1) throw new Error("cert");
  const tbs = cert.children[0];
  const versioned = tbs.children[0]?.tag === 0xa0;
  const spki = tbs.children[versioned ? 6 : 5];
  if (!spki || spki.tag !== 0x30) throw new Error("cert");
  return copyBytes(bytes.slice(spki.start, spki.end));
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function readJson(bytes: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function verifyFirebaseIdToken(
  token: string,
  options: { now: number; certs: Record<string, string>; projectId?: string },
): Promise<FirebasePhoneClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header: { alg?: unknown; kid?: unknown };
  let payload: Record<string, unknown>;
  try {
    header = readJson(base64UrlToBytes(encodedHeader)) as { alg?: unknown; kid?: unknown };
    payload = readJson(base64UrlToBytes(encodedPayload)) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string") return null;
  const pem = options.certs[header.kid];
  if (!pem) return null;
  const projectId = options.projectId ?? FIREBASE_PROJECT_ID;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (payload.aud !== projectId) return null;
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= options.now) return null;
  if (typeof payload.sub !== "string" || !payload.sub) return null;
  if (typeof payload.phone_number !== "string" || !/^\+[1-9]\d{7,14}$/.test(payload.phone_number)) return null;
  const firebase = payload.firebase;
  if (!firebase || typeof firebase !== "object" || (firebase as { sign_in_provider?: unknown }).sign_in_provider !== "phone") return null;
  try {
    const key = await crypto.subtle.importKey(
      "spki",
      spkiFromCertificate(pem),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      copyBytes(base64UrlToBytes(encodedSignature)),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );
    if (!valid) return null;
  } catch {
    return null;
  }
  return { phone: payload.phone_number, subject: payload.sub };
}

export async function fetchSecureTokenCerts(fetchImpl: typeof fetch): Promise<Record<string, string>> {
  const response = await fetchImpl(SECURETOKEN_CERTS_URL);
  if (!response.ok) throw new Error("certs");
  const body = (await response.json()) as unknown;
  if (!body || typeof body !== "object") throw new Error("certs");
  return body as Record<string, string>;
}
