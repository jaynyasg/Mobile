import { describe, expect, it } from "vitest";
import { bookingContactErrors } from "./bookingContact";
import { confirmedPayment } from "./passPay";

const valid = { hostName: "Ada Lovelace", hostEmail: "ada@example.com", hostPhone: "+1 (340) 555-0100" };
describe("booking contact", () => {
  it("requires all three fields", () => {
    for (const field of ["hostName", "hostEmail", "hostPhone"] as const) {
      for (const value of [undefined, null, "", "   ", 123]) expect(bookingContactErrors({ ...valid, [field]: value })[field]).toBeTruthy();
    }
  });
  it("accepts international names and phone formats, rejecting invalid details", () => {
    expect(bookingContactErrors({ ...valid, hostName: " 李明 ", hostPhone: "+44 20 7946 0018" })).toEqual({});
    expect(bookingContactErrors({ ...valid, hostEmail: "ada@", hostPhone: "call me" })).toHaveProperty("hostEmail");
    expect(bookingContactErrors({ ...valid, hostPhone: "123" })).toHaveProperty("hostPhone");
    expect(bookingContactErrors({ ...valid, hostPhone: "1234567890123456" })).toHaveProperty("hostPhone");
  });
});
describe("payment completion", () => {
  it("does not advance a pending, failed, wrong-tier, or missing payment", () => {
    expect(confirmedPayment({ status: "complete", paymentStatus: "paid", tier: "beach" }, "beach")).toBe(true);
    for (const status of [{}, { status: "complete", paymentStatus: "unpaid", tier: "beach" }, { status: "open", paymentStatus: "paid", tier: "beach" }, { status: "complete", paymentStatus: "paid", tier: "vip" }]) expect(confirmedPayment(status, "beach")).toBe(false);
  });
});
