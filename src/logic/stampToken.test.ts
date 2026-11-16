import { describe, expect, it } from "vitest";
import { stampShortCode, stampToken, verifyStampCode } from "./stampToken";

const secret = "test-stamp-secret";

describe("island stamp codes", () => {
  it("accepts the QR token and the short code, and rejects a guess", async () => {
    const token = await stampToken(secret, "tech");
    const short = await stampShortCode(secret, "law");
    expect(token.startsWith("tech.")).toBe(true);
    expect(short.startsWith("LAW-")).toBe(true);
    expect(await verifyStampCode(secret, token)).toBe("tech");
    expect(await verifyStampCode(secret, short.toLowerCase())).toBe("law");
    expect(await verifyStampCode(secret, "tech")).toBeNull();
    expect(await verifyStampCode(secret, "tech.00")).toBeNull();
    expect(await verifyStampCode("other-secret", token)).toBeNull();
    expect(await verifyStampCode("", token)).toBeNull();
  });
});
