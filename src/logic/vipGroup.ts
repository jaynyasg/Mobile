/** VIP group booking is 8 shares of $5,000. These rules are the ones the database enforces too. */

export const VIP_SHARES = 8;
export const SHARE_DOLLARS = 5_000;
export const TOTAL_DOLLARS = VIP_SHARES * SHARE_DOLLARS;
export const HOLD_MS = 30 * 60 * 1000;
export const DEADLINE_MS = 14 * 24 * 60 * 60 * 1000;
export const REMINDER_MS = 3 * 24 * 60 * 60 * 1000;
export const SHARED_BOAT_SUBJECT = "TATEL VIP: guest open to sharing a boat";
export const TEAM_NOTIFY_EMAIL = "cannon@18seventy8.com";
export const TEAM_NOTIFY_FROM = "passes@tatel.app";

export type BoatPreference = "full_boat" | "shared";
export type BookingStatus = "open" | "filled" | "expired";
export type ShareStatus = "reserved" | "paid" | "released";
export type ReminderKind = "three_days" | "deadline";

export interface ShareHold {
  sessionId: string;
  quantity: number;
  status: ShareStatus;
  expiresAt: number | null;
  payerEmail: string | null;
}

export interface BookingFacts {
  code: string;
  boatPreference: BoatPreference;
  hostName: string | null;
  hostEmail: string | null;
  hostPhone: string | null;
  paidShares: number;
  deadline: string;
  createdAt: string;
  payers?: { email: string | null; quantity: number }[];
}

export interface TeamEmail {
  kind: "started" | "shared" | "payment" | "filled" | "three_days" | "deadline";
  subject: string;
  text: string;
}

export function boatPreference(value: unknown): BoatPreference | null {
  if (value === "full_boat" || value === "shared") return value;
  return null;
}

export function boatPreferenceLabel(value: BoatPreference): string {
  return value === "shared" ? "Open to sharing a boat" : "Full boat (own group of 8)";
}

export function deadlineFrom(createdAt: number): number {
  return createdAt + DEADLINE_MS;
}

export function bookingStatus(paid: number, deadline: number, now: number): BookingStatus {
  if (paid >= VIP_SHARES) return "filled";
  if (now >= deadline) return "expired";
  return "open";
}

export function reminderKind(
  booking: { status: BookingStatus; deadline: number; notified3d: boolean; notifiedDeadline: boolean },
  now: number,
): ReminderKind | null {
  if (booking.status === "filled") return null;
  if (now >= booking.deadline) return booking.notifiedDeadline ? null : "deadline";
  if (now >= booking.deadline - REMINDER_MS) return booking.notified3d ? null : "three_days";
  return null;
}

export function tally(shares: ShareHold[], now: number): { paid: number; reserved: number; remaining: number } {
  let paid = 0;
  let reserved = 0;
  for (const share of shares) {
    if (share.status === "paid") paid += share.quantity;
    else if (share.status === "reserved" && (share.expiresAt ?? 0) > now) reserved += share.quantity;
  }
  return { paid, reserved, remaining: Math.max(0, VIP_SHARES - paid - reserved) };
}

export function releaseExpired(shares: ShareHold[], now: number): ShareHold[] {
  return shares.map((share) => (
    share.status === "reserved" && (share.expiresAt ?? 0) <= now ? { ...share, status: "released" } : share
  ));
}

export function reserveShares(
  shares: ShareHold[],
  quantity: number,
  now: number,
  sessionId: string,
  expiresAt: number,
  payerEmail: string | null,
): { ok: true; shares: ShareHold[] } | { ok: false; reason: "full" | "quantity" } {
  const current = releaseExpired(shares, now);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > VIP_SHARES) return { ok: false, reason: "quantity" };
  if (quantity > tally(current, now).remaining) return { ok: false, reason: "full" };
  return {
    ok: true,
    shares: [...current, { sessionId, quantity, status: "reserved", expiresAt, payerEmail }],
  };
}

export function recordPayment(
  shares: ShareHold[],
  sessionId: string,
  quantity: number,
  now: number,
  payerEmail: string | null,
): { ok: true; shares: ShareHold[]; paid: number; applied: boolean; justFilled: boolean } | { ok: false; reason: "full" | "quantity" } {
  const current = releaseExpired(shares, now);
  const existing = current.find((share) => share.sessionId === sessionId);
  if (existing?.status === "paid") {
    const paid = tally(current, now).paid;
    return { ok: true, shares: current, paid, applied: false, justFilled: false };
  }
  if (existing) {
    const quantityToApply = existing.status === "reserved" ? existing.quantity : quantity;
    if (existing.status === "released") {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > VIP_SHARES) return { ok: false, reason: "quantity" };
      const others = current.filter((share) => share.sessionId !== sessionId);
      if (quantity > tally(others, now).remaining) return { ok: false, reason: "full" };
    }
    const next = current.map((share) => (
      share.sessionId === sessionId
        ? { ...share, status: "paid" as const, quantity: quantityToApply, payerEmail: payerEmail ?? share.payerEmail, expiresAt: null }
        : share
    ));
    const paid = tally(next, now).paid;
    return { ok: true, shares: next, paid, applied: true, justFilled: paid >= VIP_SHARES };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > VIP_SHARES) return { ok: false, reason: "quantity" };
  if (quantity > tally(current, now).remaining) return { ok: false, reason: "full" };
  const next = [...current, { sessionId, quantity, status: "paid" as const, expiresAt: null, payerEmail }];
  const paid = tally(next, now).paid;
  return { ok: true, shares: next, paid, applied: true, justFilled: paid >= VIP_SHARES };
}

export function progressLine(paidShares: number): string {
  const paid = Math.max(0, paidShares) * SHARE_DOLLARS;
  return `${paidShares} of ${VIP_SHARES} shares paid · ${money(paid)} of ${money(TOTAL_DOLLARS)}`;
}

export function money(dollars: number): string {
  return `$${dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function timeLeftLine(deadline: string, now: number): string {
  const ms = Date.parse(deadline) - now;
  if (!Number.isFinite(ms) || ms <= 0) return "The 14 days are over";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `${days} days ${hours} hours left`;
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours} hours ${minutes} minutes left`;
}

export function formatWhen(ms: number): string {
  return new Date(ms).toISOString().replace(".000Z", "Z");
}

function known(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function emailBody(booking: BookingFacts, when: number, extra: string[] = []): string {
  const lines = [
    `Booking code: ${booking.code}`,
    `Boat preference: ${boatPreferenceLabel(booking.boatPreference)}`,
    `Link: https://tatel.app/pass/vip/${booking.code}`,
  ];
  const name = known(booking.hostName);
  const email = known(booking.hostEmail);
  const phone = known(booking.hostPhone);
  if (name) lines.push(`Host name: ${name}`);
  if (email) lines.push(`Host email: ${email}`);
  if (phone) lines.push(`Host phone: ${phone}`);
  lines.push(`Shares paid: ${booking.paidShares} of ${VIP_SHARES}`);
  lines.push(`Time: ${formatWhen(when)}`);
  const payers = booking.payers ?? [];
  if (payers.length) {
    lines.push("Paid so far:");
    for (const payer of payers) {
      lines.push(`${payer.email ?? "unknown"} paid ${payer.quantity} shares (${money(payer.quantity * SHARE_DOLLARS)})`);
    }
  }
  return [...lines, ...extra].join("\n");
}

export function emailsOnCreate(booking: BookingFacts, when: number): TeamEmail[] {
  const started: TeamEmail = {
    kind: "started",
    subject: "TATEL VIP: group booking started",
    text: emailBody(booking, when),
  };
  if (booking.boatPreference !== "shared") return [started];
  return [started, {
    kind: "shared",
    subject: SHARED_BOAT_SUBJECT,
    text: emailBody(booking, when),
  }];
}

export function paymentEmail(booking: BookingFacts, when: number, quantity: number, payerEmail: string | null): TeamEmail {
  return {
    kind: "payment",
    subject: `TATEL VIP: share paid (${booking.paidShares} of ${VIP_SHARES})`,
    text: emailBody(booking, when, [`This payment: ${quantity} shares${payerEmail ? ` from ${payerEmail}` : ""}`]),
  };
}

export function filledEmail(booking: BookingFacts, when: number): TeamEmail {
  return {
    kind: "filled",
    subject: "TATEL VIP: booking filled",
    text: emailBody(booking, when, ["Booking confirmed. All 8 shares are paid."]),
  };
}

export function reminderEmail(booking: BookingFacts, when: number, kind: ReminderKind): TeamEmail {
  const waiting = "People are waiting. There is no automatic refund. Follow up by hand.";
  if (kind === "deadline") {
    return {
      kind,
      subject: "TATEL VIP: deadline reached, people are waiting",
      text: emailBody(booking, when, [waiting]),
    };
  }
  return {
    kind,
    subject: "TATEL VIP: 3 days left, people are waiting",
    text: emailBody(booking, when, [waiting]),
  };
}

export async function verifyStripeSignature(payload: string, header: string, secret: string, now = Date.now()): Promise<boolean> {
  const parts = header.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2) ?? "";
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  const sent = Number(timestamp);
  if (!timestamp || !signatures.length || !Number.isFinite(sent)) return false;
  if (Math.abs(now - sent * 1000) > 5 * 60 * 1000) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return signatures.some((signature) => sameHex(hex, signature.toLowerCase()));
}

function sameHex(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}
