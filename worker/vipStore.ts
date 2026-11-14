import {
  boatPreference,
  bookingStatus,
  deadlineFrom,
  recordPayment,
  releaseExpired,
  reminderKind,
  reserveShares,
  tally,
  type BoatPreference,
  type ReminderKind,
  type ShareHold,
} from "../src/logic/vipGroup";

export interface VipRecord {
  id: string;
  code: string;
  boatPreference: BoatPreference;
  status: "open" | "filled" | "expired";
  paidShares: number;
  reservedShares: number;
  remaining: number;
  deadline: string;
  createdAt: string;
  hostName: string | null;
  hostEmail: string | null;
  hostPhone: string | null;
  payers: { email: string | null; quantity: number }[];
}

export interface DueRecord extends VipRecord {
  kind: ReminderKind;
}

export interface CreateBooking {
  code: string;
  boatPreference: BoatPreference;
  hostEmail: string | null;
  hostUserId: string | null;
  hostName: string | null;
  hostPhone: string | null;
  now: number;
}

export interface ReserveBooking {
  code: string;
  sessionId: string;
  quantity: number;
  expiresAt: number;
  payerEmail: string | null;
  now: number;
}

export interface RecordBooking {
  sessionId: string;
  quantity: number;
  payerEmail: string | null;
  bookingId: string | null;
  now: number;
}

export interface VipStore {
  create(input: CreateBooking): Promise<VipRecord>;
  get(code: string, now: number): Promise<VipRecord | null>;
  reserve(input: ReserveBooking): Promise<{ ok: true; booking: VipRecord } | { ok: false; reason: "full" | "closed" | "missing" | "quantity" }>;
  release(sessionId: string): Promise<void>;
  record(input: RecordBooking): Promise<
    { ok: true; booking: VipRecord; applied: boolean; justFilled: boolean; needsRefund: boolean } | { ok: false; reason: "missing" | "quantity" | "full" }
  >;
  due(now: number): Promise<DueRecord[]>;
  markNotified(code: string, kind: ReminderKind): Promise<void>;
}

interface Stored {
  id: string;
  code: string;
  hostName: string | null;
  hostEmail: string | null;
  hostPhone: string | null;
  boatPreference: BoatPreference;
  createdAt: number;
  deadline: number;
  notified3d: boolean;
  notifiedDeadline: boolean;
  shares: ShareHold[];
}

function view(row: Stored, now: number): VipRecord {
  row.shares = releaseExpired(row.shares, now);
  const counts = tally(row.shares, now);
  return {
    id: row.id,
    code: row.code,
    boatPreference: row.boatPreference,
    status: bookingStatus(counts.paid, row.deadline, now),
    paidShares: counts.paid,
    reservedShares: counts.reserved,
    remaining: counts.remaining,
    deadline: new Date(row.deadline).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
    hostName: row.hostName,
    hostEmail: row.hostEmail,
    hostPhone: row.hostPhone,
    payers: row.shares.filter((share) => share.status === "paid").map((share) => ({ email: share.payerEmail, quantity: share.quantity })),
  };
}

/** In-memory stand-in for the database rules. Tests use this. Production uses the edge function. */
export function memoryVipStore(): VipStore {
  const rows = new Map<string, Stored>();
  const bySession = new Map<string, string>();

  return {
    async create(input) {
      const row: Stored = {
        id: crypto.randomUUID(),
        code: input.code,
        hostName: input.hostName,
        hostEmail: input.hostEmail,
        hostPhone: input.hostPhone,
        boatPreference: input.boatPreference,
        createdAt: input.now,
        deadline: deadlineFrom(input.now),
        notified3d: false,
        notifiedDeadline: false,
        shares: [],
      };
      rows.set(row.code, row);
      return view(row, input.now);
    },
    async get(code, now) {
      const row = rows.get(code);
      return row ? view(row, now) : null;
    },
    async reserve(input) {
      const row = rows.get(input.code);
      if (!row) return { ok: false, reason: "missing" };
      if (view(row, input.now).status !== "open") return { ok: false, reason: "closed" };
      const next = reserveShares(row.shares, input.quantity, input.now, input.sessionId, input.expiresAt, input.payerEmail);
      if (!next.ok) return { ok: false, reason: next.reason === "quantity" ? "quantity" : "full" };
      row.shares = next.shares;
      bySession.set(input.sessionId, row.code);
      return { ok: true, booking: view(row, input.now) };
    },
    async release(sessionId) {
      const row = rows.get(bySession.get(sessionId) ?? "");
      if (!row) return;
      row.shares = row.shares.map((share) => (
        share.sessionId === sessionId && share.status === "reserved" ? { ...share, status: "released" } : share
      ));
    },
    async record(input) {
      const code = bySession.get(input.sessionId);
      let row = code ? rows.get(code) : undefined;
      if (!row && input.bookingId) row = [...rows.values()].find((item) => item.id === input.bookingId);
      if (!row) return { ok: false, reason: "missing" };
      const next = recordPayment(row.shares, input.sessionId, input.quantity, input.now, input.payerEmail);
      if (!next.ok) return { ok: false, reason: "quantity" };
      row.shares = next.shares;
      bySession.set(input.sessionId, row.code);
      return { ok: true, booking: view(row, input.now), applied: next.applied, justFilled: next.justFilled, needsRefund: next.needsRefund };
    },
    async due(now) {
      const due: DueRecord[] = [];
      for (const row of rows.values()) {
        const booking = view(row, now);
        const kind = reminderKind({
          status: booking.status,
          deadline: row.deadline,
          notified3d: row.notified3d,
          notifiedDeadline: row.notifiedDeadline,
        }, now);
        if (kind) due.push({ ...booking, kind });
      }
      return due;
    },
    async markNotified(code, kind) {
      const row = rows.get(code);
      if (!row) return;
      if (kind === "three_days") row.notified3d = true;
      if (kind === "deadline") row.notifiedDeadline = true;
    },
  };
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function numberField(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function textField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function parseVipRecord(body: unknown): VipRecord {
  const row = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const preference = boatPreference(row.boatPreference);
  const status = row.status === "filled" || row.status === "expired" || row.status === "open" ? row.status : null;
  if (!preference || !status || typeof row.id !== "string" || typeof row.code !== "string") throw new Error("unavailable");
  const payers = Array.isArray(row.payers) ? row.payers.flatMap((payer) => {
    if (!payer || typeof payer !== "object") return [];
    const record = payer as { email?: unknown; quantity?: unknown };
    const quantity = numberField(record.quantity);
    return quantity > 0 ? [{ email: textField(record.email), quantity }] : [];
  }) : [];
  return {
    id: row.id,
    code: row.code,
    boatPreference: preference,
    status,
    paidShares: numberField(row.paidShares),
    reservedShares: numberField(row.reservedShares),
    remaining: numberField(row.remaining),
    deadline: textField(row.deadline) ?? new Date(0).toISOString(),
    createdAt: textField(row.createdAt) ?? new Date(0).toISOString(),
    hostName: textField(row.hostName),
    hostEmail: textField(row.hostEmail),
    hostPhone: textField(row.hostPhone),
    payers,
  };
}

export function remoteVipStore(
  env: { SUPABASE_URL?: string; VIP_BOOKING_SECRET?: string },
  fetchImpl: FetchLike = fetch,
): VipStore | null {
  if (!env.SUPABASE_URL || !env.VIP_BOOKING_SECRET) return null;
  const url = `${env.SUPABASE_URL.replace(/\/$/, "")}/functions/v1/tatel-vip-booking`;
  const secret = env.VIP_BOOKING_SECRET;

  async function call(action: string, payload: Record<string, unknown>): Promise<{ status: number; body: unknown }> {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        Origin: "https://tatel.app",
      },
      body: JSON.stringify({ action, payload }),
    });
    try {
      return { status: response.status, body: await response.json() };
    } catch {
      return { status: response.status, body: null };
    }
  }

  function reason(body: unknown): string {
    return body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : "unavailable";
  }

  return {
    async create(input) {
      const result = await call("create", {
        code: input.code,
        boatPreference: input.boatPreference,
        hostEmail: input.hostEmail,
        hostUserId: input.hostUserId,
        hostName: input.hostName,
        hostPhone: input.hostPhone,
      });
      if (!result.status || result.status >= 300) throw new Error(reason(result.body));
      return parseVipRecord(result.body);
    },
    async get(code) {
      const result = await call("get", { code });
      if (result.status === 404) return null;
      if (result.status >= 300) throw new Error(reason(result.body));
      return parseVipRecord(result.body);
    },
    async reserve(input) {
      const result = await call("reserve", {
        code: input.code,
        sessionId: input.sessionId,
        quantity: input.quantity,
        payerEmail: input.payerEmail,
        expiresAt: new Date(input.expiresAt).toISOString(),
      });
      if (result.status === 404) return { ok: false, reason: "missing" };
      const error = reason(result.body);
      if (result.status === 400 && (error === "full" || error === "closed" || error === "quantity")) {
        return { ok: false, reason: error };
      }
      if (result.status >= 300) throw new Error(error);
      return { ok: true, booking: parseVipRecord(result.body) };
    },
    async release(sessionId) {
      const result = await call("release", { sessionId });
      if (result.status < 200 || result.status >= 300) throw new Error(reason(result.body));
    },
    async record(input) {
      const result = await call("record", {
        sessionId: input.sessionId,
        quantity: input.quantity,
        payerEmail: input.payerEmail,
        bookingId: input.bookingId,
      });
      if (result.status < 200 || result.status >= 300) throw new Error(reason(result.body));
      const body = result.body as { applied?: unknown; justFilled?: unknown; needsRefund?: unknown };
      return {
        ok: true,
        booking: parseVipRecord(result.body),
        applied: body.applied === true,
        justFilled: body.justFilled === true,
        needsRefund: body.needsRefund === true,
      };
    },
    async due() {
      const result = await call("due", {});
      if (result.status >= 300 || !Array.isArray(result.body)) throw new Error(reason(result.body));
      return result.body.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const kind = (item as { kind?: unknown }).kind;
        if (kind !== "three_days" && kind !== "deadline") return [];
        try {
          const booking = parseVipRecord(item);
          if (booking.status === "filled") return [];
          return [{ ...booking, kind }];
        } catch {
          return [];
        }
      });
    },
    async markNotified(code, kind) {
      const result = await call("mark", { code, kind });
      if (result.status >= 300) throw new Error(reason(result.body));
    },
  };
}
