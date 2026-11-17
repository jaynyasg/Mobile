# CEO experience integration

Source: the user-supplied CEO brief and clarifications on November 16, 2026. Booking reference: https://tatel.18seventy8.com/tatel/index.html and its public app.js provider dialog.

## Delivered behavior

- Opening story explains TATEL, 1878 LLC, CFEG Learning Labs, the Technology Mill, the four-day working method, five infrastructure areas, eight island needs, and the island experience. Final choices start ticket planning, accommodation planning for ticket holders, or Explore.
- The manual island slideshow uses existing, identified property photography. St. Croix and the area around Tortola have text introductions; no photograph is assigned an unverified location. Existing panelists, video files, and backgrounds remain unchanged.
- Plain-language island needs appear during intake and session refinement. Matching uses curated workstream associations across the real program. Specific fields remain available, and existing preferences are preserved.
- Daily overview links to that day's program. Session pages link the actual connected workstream. A private device notebook captures the need, solution, test, results, ownership, and annual review notes, with save/export and device-data deletion.
- Stays and bookable activities use provider windows. Known providers that require their own site show an overview and an external booking action. Embeddable sites have an external fallback for blocked pages or payment steps. Browsing never marks accommodation booked.
- Explore and Me include program updates, the daily overview, notebook, and an invitation-sharing action. Existing panelists, Chat, activities, and stamps remain available.
- Near Tortola replaces the former Jost Van Dyke event location on bundled and refreshed content. Other session locations remain intact. Outdated fixed-route pictures, the old property recommendation, and precise transfer times to the unknown replacement venue are withheld. Independent ferry information retains real geographic names.

## Boundaries and outstanding event information

The Ritz-Carlton, St. Thomas listing now links to its [official hotel booking page](https://www.ritzcarlton.com/en/hotels/sttrz-the-ritz-carlton-st-thomas/overview/), replacing the unrelated boat-detail link. A marina or beach-club day visit cannot be saved as overnight accommodation.

The website uses a provider iframe/overview pattern, not a common hotel inventory or reservation API. A provider controls availability, checkout, confirmation, cookies, and whether its pages can be embedded. Complete booking inside every provider window cannot be guaranteed without provider integration agreements.

The specific Entertainment venue, landing point, and transfers near Tortola still need confirmation. The brief's 50+ confirmed panelists, 50+ participants, and five daily island hops were not independently established; the app retains actual program counts and proposed status, with conditional transport language. Current program contains 48 panelists and 205 sessions.

The notebook is local to the device, with an explicit export. Shared projects, server-side annual review tracking, automatic reminders, and new booking inventory are not represented as operational services.

Dropbox viewing access was checked. No Dropbox panelist, video, or background replacement was made, as requested.

## Verification

Unit coverage exercises normalization after remote refresh, preserved panelists/media, cross-area need matching, connected days, unknown transfer timing, provider URL handling, notebook persistence/export and storage errors, and one-time entry choices. Browser scripts cover existing selected-ticket checkout and personalized flows, plus story entry choices, day deep links, notebooks, island navigation, and provider confirmation/fallbacks. Readability includes 320px phones and enlarged text. External transactions are isolated in browser tests.
