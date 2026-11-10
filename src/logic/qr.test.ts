import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { passPayload } from "./state";

describe("pass preview code", () => {
  it("builds a square matrix with a dark finder corner", () => {
    const qr = QRCode.create(passPayload("beach"), { errorCorrectionLevel: "M" });
    expect(qr.modules.size).toBeGreaterThan(20);
    expect(qr.modules.get(0, 0)).toBe(1);
    expect(passPayload("beach")).toContain("tatel:pass-preview:");
  });
});
