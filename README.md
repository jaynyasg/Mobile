# TATEL · Conversations

A mobile preview of TATEL · Conversations, January 26–29, 2027, across the Virgin Islands. The website export is the source of truth: 205 sessions, 49 panelists, and five island accommodation stops. Specific venues, some clock times, and some leads are still unconfirmed, and the app says so the same way the site does. The word “Proposed” is kept out of the interface.

The app is Expo SDK 58 with React Native and TypeScript. The install path is the web app. Android and iOS builds still open in Expo Go.

## Shared program data

[`src/content/tatel.json`](src/content/tatel.json) is the offline copy. On launch the app requests the website file and, if that succeeds and validates, replaces the copy in memory and caches it on the device. A failed or offline request keeps the cache, then the bundled file.

The default URL path is `/tatel/downloads/tatel-2027-program.json` (same origin as the published site). Override it with:

```bash
EXPO_PUBLIC_CONTENT_URL=https://example.com/tatel/downloads/tatel-2027-program.json
```

The parser accepts today’s download (`program`, `sessions`, `agendas`, `presenters`) and the future canonical `program.json` (`version`, `updatedAt`, `timezone`, `days`, `sessions`, `presenters`, `accommodations`). A session can later carry `venue.specific` without an app change. Until then every session points at its island’s accommodations stop and the specific venue is “to be confirmed”.

Regenerate the bundle from an extracted website archive:

```bash
TATEL_SOURCE=/path/to/tatel-site npm run generate
```

The canonical input is `raw/public/tatel/downloads/tatel-2027-program.json`, plus `venues.json`. Portraits are referenced only when the file is already in `assets/tatel/portraits`.

## Run it

```bash
npm install
npm run typecheck
npm test
npm run web
```

Expo serves the preview at `http://localhost:8081`.

### Installable website

```bash
npm run export:web
```

That writes a static PWA to `dist/`: manifest name “TATEL · Conversations”, standalone display, navy theme and background, icons from the 1878 mark, a service worker that caches the shell, and iOS `apple-touch-icon` / `apple-mobile-web-app-capable` tags.

Deploy `dist/` as a static site. Nothing in this repo publishes it.

- Netlify: `netlify.toml` builds with `npm run export:web` and publishes `dist/`.
- Vercel: `vercel.json` uses the same command and output directory.

From a machine with the CLIs, `netlify deploy --dir=dist` or `vercel deploy dist` will upload that folder. Host the PWA on the same domain as `/tatel/downloads/tatel-2027-program.json` so the sync request stays same-origin.

### On an Android phone

1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) for SDK 58.
2. Use the same Wi-Fi as the computer.
3. Run `npm start` and scan the QR code inside Expo Go.
4. If the phone cannot see the computer, run `npx expo start --tunnel`.

`npm run android` opens Expo Go when a device or emulator is on `adb`. `npm run ios` needs macOS.

The home screen also explains Add to Home Screen on iOS Safari, and shows an Install button when Chrome fires `beforeinstallprompt`.

## What you can do

Bottom tabs: **Home**, **Agenda**, **Panelists**, **Network**, **More**.

- Home plays the beacon film behind a navy overlay, with a still frame when autoplay is blocked, reduced motion is on, or data saver is on.
- Agenda filters by day, pillar, island, type, and panelist. Timed sessions show Atlantic time and the phone’s clock. Sessions with `timeLabel` show that label, including “Opening · Time TBC”.
- A session with no lead says “Speaker to be announced”. Leads show the role from the site (`Session lead` or `Keynote speaker`).
- Each session’s location is its island accommodations entry (dock and stay links). The specific venue field is “to be confirmed” until a later file sets `venue.specific`.
- Venue pages include a 3D viewer. The bundled model is a sample triangle, labeled as not a venue. A real `.glb` can be set on `venue.model`.
- Panelist profiles use a portrait when the file is present.
- Sample transport, accommodations, the pass preview, the on-device guide, opt-in local notes, and Delete my data are still here.

## What is real, and what is still unconfirmed

From the website export:

- 205 sessions (200 core, 5 supplementary) and 49 panelists
- Leads after `schedule-assignments.js`, including AI-KEYNOTE-D1
- Five accommodation stops and their provider links
- The draft notice and the timing note

Still unconfirmed in that source:

- Specific venues
- Clock times on the five supplementary activities
- Ten leads marked “Speaker to be announced”
- Transport connections and pass prices

Real in the app: navigation, filters, search, favorites, time zones, the sync parser and offline fallback, the PWA shell, and deletion of on-device notes.

Not sent anywhere: local notes, the pass QR, and the sample 3D model.

## Project layout

```
src/content     bundled program, schema, and runtime loader
src/app         screens, including the PWA HTML shell
public          manifest, service worker, beacon video, sample glTF
scripts/generate-tatel-content.mjs
scripts/finalize-pwa.mjs
```
