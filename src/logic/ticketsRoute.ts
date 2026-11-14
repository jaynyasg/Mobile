export interface TicketQuery {
  checkout?: string | null;
  tier?: string | null;
  session_id?: string | null;
}

/** Old /passport links open Tickets and keep the checkout query. */
export function ticketsLocation(query: TicketQuery = {}): string {
  const params = new URLSearchParams();
  if (query.checkout) params.set("checkout", query.checkout);
  if (query.tier) params.set("tier", query.tier);
  if (query.session_id) params.set("session_id", query.session_id);
  const search = params.toString();
  return search ? `/tickets?${search}` : "/tickets";
}
