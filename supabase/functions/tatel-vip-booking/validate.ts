const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reject values that would throw inside a SQL cast. Empty fields are left for the database to treat as missing. */
export function invalidBookingField(payload: Record<string, unknown>): "bookingId" | "expiresAt" | null {
  if (payload.bookingId != null && payload.bookingId !== "") {
    if (typeof payload.bookingId !== "string" || !UUID.test(payload.bookingId)) return "bookingId";
  }
  if (payload.expiresAt != null && payload.expiresAt !== "") {
    if (typeof payload.expiresAt !== "string" || !Number.isFinite(Date.parse(payload.expiresAt))) return "expiresAt";
  }
  return null;
}
