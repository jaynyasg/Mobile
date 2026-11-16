import type { PassTier } from "../logic/passPay";

/** Guest-facing explanations stay consistent even when the program is refreshed. */
export const ticketGuide: Record<PassTier, { name: string; tagline: string; description: string; stay: string; travel: string; details: string }> = {
  beach: {
    name: "Be on the Beach",
    tagline: "Feet in the sand. Ideas in motion.",
    description: "Make the island your base. Join TATEL's land-based sessions, meet your collaborators, and leave room for beach time before returning to your hotel, villa, or home.",
    stay: "Book your own accommodation on land. A room is not included with this ticket.",
    travel: "Want to attend a session on another island? Arrange your own public ferry and local transfers. Check the route and return sailing before you save your plans; some island stops need a separate boat transfer.",
    details: "Ferry seats are not reserved by TATEL. Confirm availability and fares with the operator. This ticket does not include a private charter or an onboard stay.",
  },
  boat: {
    name: "Be on the Boat",
    tagline: "Chase ideas across the water.",
    description: "Let the journey become part of the experience. Travel with a group on a private day charter to sessions across the islands, then return to your own beautiful base ashore.",
    stay: "Book your own hotel or villa. This is a day-charter experience, with no overnight berth.",
    travel: "The TATEL team confirms your charter, boarding dock, and departure times. Plan around those confirmed departures and arrange your local travel to the dock.",
    details: "Your charter travels with a group. It is not an on-demand water taxi. Check which sessions and island stops your departure serves before finalizing your schedule.",
  },
  vip: {
    name: "Be on Board",
    tagline: "Wake up to a different kind of possibility.",
    description: "Make the yacht your home for five days. Stay aboard a full charter, share the journey with your group, and move between islands with the TATEL experience. Your boat is your accommodation and your base for the adventure.",
    stay: "Your stay is aboard the charter. You only need a separate hotel if you want extra nights before or after the trip.",
    travel: "The team confirms your boat, berth, boarding location, and itinerary. The summit runs January 26–29; confirm the five-day charter's check-in and check-out dates with the team.",
    details: "Eight shares at $5,000 each: $40,000 for a full boat. Bring your own group of eight or ask to share with other guests. VIP sessions, local guides, and curated lunches and dinners are listed in the package. Starting a booking creates a group link; it does not complete payment or confirm a berth.",
  },
};
