import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { PASS_PAYLOAD } from "./state";

describe("badge code", () => {
  it("builds a square matrix with a dark finder corner", () => {
    const qr = QRCode.create(PASS_PAYLOAD, { errorCorrectionLevel: "M" });
    expect(qr.modules.size).toBeGreaterThan(20);
    expect(qr.modules.get(0, 0)).toBe(1);
  });
});
