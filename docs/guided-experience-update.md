# TATEL guided experience update

The app now guides a new guest through **ticket → accommodation → saved sessions → Explore**, using the answers from the opening questions. Existing tickets and arranged accommodation are skipped. Choosing the five-day onboard experience leaves hotel booking out unless the guest asks for extra nights.

## Session choices and the island experience

The follow-up adds a three-step guide at the start of Sessions:

1. Choose one or more of the five infrastructure areas.
2. Narrow those choices to sub-infrastructure fields already represented in the program, such as AgriTech, EdTech, or FilmTech. Each field has a plain-language explanation.
3. Choose a purpose: understand a challenge, shape a solution, build something useful, or share ideas and find partners. These correspond to the program's four phases.

Matches must satisfy all selected dimensions. An empty result explains how to broaden the choices instead of presenting unrelated sessions. Each recommended card shows the session's actual outcome, field, phase, time, and island. Choices and saved sessions persist on the device. Guests can change their choices or jump to the full program at any point.

Explore now introduces four guide stops: meet the panelists, join the community and chat, make time for island experiences, and use the stamp card. The guide remembers the guest's place and keeps shortcuts available afterward. Activity and stamp-card buttons scroll directly to those sections. Opening the guide or an island page does not award stamps.

Two closing story slides introduce the people, conversations, and vacation side of TATEL. Session details identify the session goal and place panelist profiles ahead of location photos. The Panelists and Community pages explain what guests can do there.

An interrupted optional sign-in preload no longer causes an unhandled error when guests quickly leave Community. The browser journey explicitly checks this failure case.

Free-time suggestions link to official guides for [USVI beaches](https://www.visitusvi.com/explore/beaches/), [water activities](https://www.visitusvi.com/explore/water-activities/), [things to do](https://www.visitusvi.com/explore/things-to-do/), and [Jost Van Dyke](https://www.bvitourism.com/the-islands/jost-van-dyke). The app distinguishes independent outings from ticket inclusions and reminds guests to plan return connections.

## Content and presentation

The experience direction is now expressed as **“Make waves. Make it matter.”** Home opens with an editorial invitation and an interactive look at the work, the escape, and the people, each linked to its relevant destination. The guided path is presented as chapters, with more room for photography and readable descriptions. Explore leads with island imagery and puts practical geography behind a clearly labeled disclosure, while keeping it available in the introduction and preparation guide.

The opening story, chapter-film captions, ticket introductions, session guide, panelist and chat introductions, and island guide now carry the same tone: glamorous island life, curiosity, connection, and adventure anchored in useful work. The existing films and ticket inclusions are preserved. The design uses the existing Bodoni/Manrope typography, deep navy, gold, and coastal imagery with stronger hierarchy and spacing; no paid media generation or new event promises were added.

- Rewrote the opening story to explain TATEL's name, purpose, island setting, and four-day summit. Kept the existing films; the story copy and section titles are updated in the app, not burned into new video files.
- Preserved the coastal photography, dark translucent cards, gold accents, and short chapter films. The guided transitions now introduce accommodation, sessions, and Explore with their section films.
- Made story text scrollable, added a pause control and reading-time allowance, reduced headline sizes on small phones, and kept Back/Next controls reachable. Long content wraps rather than competing with session-save controls.
- Made ticket names and explanations consistent across Tickets, onboarding, Routes, Preparation, Explore, and Me.
- Put the next-step action after the ticket catalog. The recommended ticket appears first, with all three options available for comparison.
- Explained each ticket's session access, accommodation, island transfers, and booking process. Beach guests arrange their own ferries and local transfers; Boat guests sleep on land; Board guests stay aboard for five days.
- Removed editorial language about what a website or planning document happens to list. Travel instructions now address the guest directly.

## Progress and booking

- Opening a screen no longer completes a step. Legacy visit-based completion flags are discarded when reading older local records.
- Accommodation is recorded only when the guest explicitly confirms that it is arranged, including the selected property when confirmed from a hotel card.
- Session progress follows the actual saved sessions. My schedule persists on the device and remains accessible from Sessions and Me.
- Be on Board requires a boat preference plus valid name, email, and phone before creating a booking. The API enforces the same contact rules before saving or sending notifications.
- Creating a group link does not mark a ticket purchased. Checkout success requires a confirmed paid response, and an unconfirmed payment prompts the guest to check their confirmation email.
- Payment notices scroll and render above the navigation so their actions remain accessible on small phones.
- Payment, booking, and account API responses bypass the service worker's offline cache. The cache version is advanced so existing installations discard older cached responses.

## iPhone Home Screen

The existing standalone manifest, Apple icon, service worker, and iOS metadata are preserved. The in-app installation guide now describes Safari's Share menu, Add to Home Screen, Edit Actions when needed, and Open as Web App when offered. The guide remains available under Me and has a scrollable layout.

The operating-system installation step still requires Safari on an actual iPhone; browser automation can verify the app's instructions, metadata, and layout but cannot perform that system action.

## Sources and decisions

- Remote code: [jaynyasg/Mobile](https://github.com/jaynyasg/Mobile), fetched into `codex/guided-tatel-experience` from `origin/main`.
- Brand and mission: [TATEL / 1878](https://tatel.18seventy8.com/), [TATEL introduction](https://intro.tatel.io/), and [partnership overview](https://partner.tatel.io/).
- Ticket descriptions follow the user's Beach / Boat / Board definitions and the app's existing package data. Public pages also use older package names; those were not substituted into the app.
- The four-day summit and five-day charter are explained separately. Boat assignments, berths, sailing times, and charter check-in/check-out remain subject to team confirmation.
- iPhone instructions: [Apple's Home Screen web-app guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

## Verification

Verified on November 16, 2026:

- TypeScript check and all **206 tests** passed after the session-guide addition.
- Production web export and Cloudflare worker dry run passed.
- The complete guided-visit script passed against the production preview in **Chromium and WebKit**, including the payment-notice overlap check.
- **312 unique route/layout combinations** passed the clipping checks. A dev-server timeout interrupted the original sweep; the remaining combinations passed against the production preview.
- The manifest, Apple icon, app icons, service worker, and HTML returned successful responses with their correct content types from the local worker.
- Production-preview screenshots are in `.vitest/guided-visit-production/`.
- The session-guide follow-up adds browser checks for infrastructure → sub-infrastructure → goal matching, saving and reloading, panelist/chat navigation, island-guide progress, and stamp-card access. Section shortcuts are checked for their actual position in the viewport. Final screenshots are in `.vitest/session-discovery-final/`.
- The six affected content routes passed another **72 route/layout checks** across the three phone sizes, both text sizes, and browser/standalone layouts.
- After the experience-direction pass, all **206 tests**, TypeScript, and the production export passed again. The expanded Chromium/WebKit journey passed at 390×844 and 320×568, including all three photographic preview destinations and the island-information disclosure. Another **84 route/layout checks** passed across seven affected routes. Current screenshots are in `.vitest/experience-tone/`.

Run from the repository root:

```powershell
npm run typecheck
npm test -- --maxWorkers=4 --testTimeout=20000
npm run web -- --port 8081
node scripts/guided-visit.mjs
npm run readability
npm run build:web
npx wrangler deploy --dry-run --outdir .vitest/worker
```

The guided browser script exercises Chromium and WebKit at 390×844 and 320×568, saved-session persistence, enlarged story text, iPhone install guidance, existing-ticket paths, contact validation, and confirmed/unconfirmed payment handling. It blocks service workers in these isolated scenarios so API mocks cannot be bypassed; it does not create real reservations, charge cards, or send messages. Service-worker caching is tested separately. Screenshots are written to `.vitest/guided-visit/`.

The readability sweep covers 26 routes at three phone sizes, normal and 130% text, and browser and standalone layouts. Unit tests cover the answer combinations, progress migration, contact/API validation, and payment status checks. Build logs and browser reports are kept under `.vitest/` and are not committed.

This update is local. It has not been pushed or deployed; the frontend and worker changes belong in the same release.
