import { describe, expect, it } from "vitest";
import {
  DEADLINE_MS,
  SHARED_BOAT_SUBJECT,
  VIP_SHARES,
  bookingStatus,
  emailsOnCreate,
  filledEmail,
  paymentEmail,
  progressLine,
  recordPayment,
  releaseExpired,
  reminderEmail,
  reminderKind,
  reserveShares,
  tally,
  verifyStripeSignature,
} from "./vipGroup";

const NOW = Date.parse("2026-11-14T01:17:00.000Z");

describe("VIP share cap", () => {
  it("keeps paid and unexpired holds at or under 8 and frees an expired hold", () => {
    let shares = reserveShares([], 6, NOW, "cs_paid", NOW + 1_000, "ada@example.com");
    expect(shares.ok).toBe(true);
    if (!shares.ok) return;
    const paid = recordPayment(shares.shares, "cs_paid", 6, NOW, "ada@example.com");
    expect(paid.ok).toBe(true);
    if (!paid.ok) return;
    const held = reserveShares(paid.shares, 1, NOW, "cs_hold", NOW + 60_000, null);
    expect(held.ok).toBe(true);
    if (!held.ok) return;
    expect(tally(held.shares, NOW)).toEqual({ paid: 6, reserved: 1, remaining: 1 });
    expect(reserveShares(held.shares, 2, NOW, "cs_over", NOW + 60_000, null)).toEqual({ ok: false, reason: "full" });
    const last = reserveShares(held.shares, 1, NOW, "cs_last", NOW + 60_000, null);
    expect(last.ok).toBe(true);
    if (!last.ok) return;
    expect(tally(last.shares, NOW).remaining).toBe(0);
    expect(reserveShares(last.shares, 1, NOW, "cs_ninth", NOW + 60_000, null).ok).toBe(false);
    const expired = releaseExpired([{ sessionId: "cs_old", quantity: 3, status: "reserved", expiresAt: NOW, payerEmail: null }], NOW);
    expect(tally(expired, NOW).remaining).toBe(VIP_SHARES);
  });

  it("does not count the same payment twice and refuses a share past the cap", () => {
    const first = recordPayment([], "cs_one", 8, NOW, "ada@example.com");
    expect(first.ok && first.justFilled && first.paid).toBe(8);
    if (!first.ok) return;
    const again = recordPayment(first.shares, "cs_one", 8, NOW, "ada@example.com");
    expect(again.ok && again.applied).toBe(false);
    expect(recordPayment([], "cs_late", 1, NOW, null).ok).toBe(true);
    const full = recordPayment(first.shares, "cs_extra", 1, NOW, "ada@example.com");
    expect(full.ok && full.needsRefund && full.paid).toBe(8);
    if (full.ok) expect(full.shares.find((share) => share.sessionId === "cs_extra")?.status).toBe("needs_refund");
    const repeated = recordPayment(full.ok ? full.shares : [], "cs_extra", 1, NOW, "ada@example.com");
    expect(repeated.ok && repeated.needsRefund).toBe(false);
    const expired = releaseExpired([{ sessionId: "cs_old", quantity: 2, status: "reserved", expiresAt: NOW, payerEmail: null }], NOW);
    const recovered = recordPayment(expired, "cs_old", 2, NOW, "ada@example.com");
    expect(recovered.ok && recovered.applied && recovered.paid).toBe(2);
    const lapsed = releaseExpired(
      [...(first.ok ? first.shares : []), { sessionId: "cs_late_hold", quantity: 1, status: "reserved", expiresAt: NOW, payerEmail: "ada@example.com" }],
      NOW,
    );
    const overflow = recordPayment(lapsed, "cs_late_hold", 1, NOW, "ada@example.com");
    expect(overflow.ok && overflow.needsRefund && overflow.paid).toBe(8);
  });
});

describe("VIP deadline", () => {
  const created = Date.parse("2026-11-01T00:00:00.000Z");
  const deadline = created + DEADLINE_MS;

  it("fills at 8 shares, expires at 14 days, and reminds once at 3 days and at the deadline", () => {
    expect(deadline - created).toBe(14 * 24 * 60 * 60 * 1000);
    expect(bookingStatus(8, deadline, deadline + 1)).toBe("filled");
    expect(bookingStatus(3, deadline, deadline - 1)).toBe("open");
    expect(bookingStatus(3, deadline, deadline)).toBe("expired");
    const open = { status: "open" as const, deadline, notified3d: false, notifiedDeadline: false };
    expect(reminderKind(open, deadline - 3 * 86_400_000 - 1)).toBeNull();
    expect(reminderKind(open, deadline - 3 * 86_400_000)).toBe("three_days");
    expect(reminderKind({ ...open, notified3d: true }, deadline - 1)).toBeNull();
    expect(reminderKind(open, deadline)).toBe("deadline");
    expect(reminderKind({ ...open, status: "filled" }, deadline)).toBeNull();
    expect(reminderKind({ ...open, notifiedDeadline: true }, deadline + 1)).toBeNull();
  });
});

describe("VIP team emails", () => {
  const booking = {
    code: "boatcode01",
    boatPreference: "shared" as const,
    hostName: "Ada Lovelace",
    hostEmail: "ada@example.com",
    hostPhone: "+13405550100",
    paidShares: 0,
    deadline: "2026-11-28T01:17:00.000Z",
    createdAt: "2026-11-14T01:17:00.000Z",
  };

  it("sends the sharing email only for a shared boat, before any shares are paid", () => {
    const shared = emailsOnCreate(booking, NOW);
    expect(shared.map((email) => email.kind)).toEqual(["started", "shared"]);
    const note = shared.find((email) => email.subject === SHARED_BOAT_SUBJECT);
    expect(note?.text).toContain("Booking code: boatcode01");
    expect(note?.text).toContain("Host name: Ada Lovelace");
    expect(note?.text).toContain("Host email: ada@example.com");
    expect(note?.text).toContain("Host phone: +13405550100");
    expect(note?.text).toContain("Shares paid: 0 of 8");
    expect(note?.text).toContain("Time: 2026-11-14T01:17:00Z");
    expect(note?.text).toContain("Open to sharing a boat");
    const full = emailsOnCreate({ ...booking, boatPreference: "full_boat" }, NOW);
    expect(full.map((email) => email.subject)).toEqual(["TATEL VIP: group booking started"]);
    expect(full.some((email) => email.subject === SHARED_BOAT_SUBJECT)).toBe(false);
    expect(full[0]?.text).toContain("Full boat (own group of 8)");
  });

  it("includes the boat preference on payment, filled, and reminder emails", () => {
    const paid = { ...booking, boatPreference: "full_boat" as const, paidShares: 3, payers: [{ email: "ada@example.com", quantity: 3 }] };
    for (const email of [
      paymentEmail(paid, NOW, 3, "ada@example.com"),
      filledEmail({ ...paid, paidShares: 8 }, NOW),
      reminderEmail(paid, NOW, "three_days"),
      reminderEmail(paid, NOW, "deadline"),
    ]) {
      expect(email.text).toContain("Boat preference: Full boat (own group of 8)");
      expect(email.text).toContain("Booking code: boatcode01");
    }
    expect(reminderEmail(paid, NOW, "deadline").text).toContain("ada@example.com paid 3 shares ($15,000)");
    expect(progressLine(3)).toBe("3 of 8 shares paid · $15,000 of $40,000");
  });
});

describe("Stripe webhook signature", () => {
  it("accepts a fresh signature and rejects a tampered body or an old timestamp", async () => {
    const payload = JSON.stringify({ type: "checkout.session.completed" });
    const secret = "whsec_test";
    const header = await sign(payload, secret, Math.floor(NOW / 1000));
    expect(await verifyStripeSignature(payload, header, secret, NOW)).toBe(true);
    expect(await verifyStripeSignature(`${payload} `, header, secret, NOW)).toBe(false);
    expect(await verifyStripeSignature(payload, header, "whsec_other", NOW)).toBe(false);
    const stale = await sign(payload, secret, Math.floor(NOW / 1000) - 6 * 60);
    expect(await verifyStripeSignature(payload, stale, secret, NOW)).toBe(false);
    expect(await verifyStripeSignature(payload, "t=nope", secret, NOW)).toBe(false);
  });
});

async function sign(payload: string, secret: string, timestamp: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}
