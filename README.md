# TATEL · Sessions

A mobile preview of TATEL · Sessions, January 26–29, 2027, across the Virgin Islands. The website export is the source of truth: 205 sessions, 48 panelists, and five island accommodation stops. Specific venues, some clock times, and some leads are still unconfirmed, and the app says so the same way the site does. The word “Proposed” is kept out of the interface.

The app is Expo SDK 58 with React Native and TypeScript. The install path is the web app. Android and iOS builds still open in Expo Go.

## Shared program data

[`src/content/tatel.json`](src/content/tatel.json) is the offline copy. On launch the app requests the website file and, if that succeeds and validates, replaces the copy in memory and caches it on the device. A failed or offline request keeps the cache, then the bundled file.

On `https://tatel.app` the app requests `/api/program`. The worker fetches the published Lovable file server-side:

`https://tatel.18seventy8.com/tatel/downloads/tatel-2027-program.json`

That host is Lovable project `e06d93b5-2057-4f6f-9494-a9a198357d4a`. Its sitemap canonical URL is `https://tatel.18seventy8.com/`. The file does not send `Access-Control-Allow-Origin`, so the browser does not read it directly. `/api/program` is same-origin. Override the request with `EXPO_PUBLIC_CONTENT_URL`.

Local web dev has no worker, so a miss on `/api/program` tries that published URL next. Native builds request the published URL directly. A failed request keeps the on-device cache, then the bundled copy.

The parser accepts today’s download (`program`, `sessions`, `agendas`, `presenters`) and the future canonical `program.json` (`version`, `updatedAt`, `timezone`, `days`, `sessions`, `presenters`, `accommodations`). A session can later carry `venue.specific` without an app change. Until then every session points at its island’s accommodations stop and the specific venue is “to be confirmed”.

Regenerate the bundle from an extracted website archive:

```bash
TATEL_SOURCE=/path/to/tatel-site npm run generate
```

The canonical input is `raw/public/tatel/downloads/tatel-2027-program.json`, plus `venues.json`. If the program file is not on disk, generate downloads `https://tatel.18seventy8.com/tatel/downloads/tatel-2027-program.json`. A missing raster portrait is downloaded from that host and saved as an optimized `.webp`. SVG files and placeholder stems stay blank, and the app shows a monogram.

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

That writes a static PWA to `dist/`: manifest name “TATEL · Sessions”, standalone display, navy theme and background, icons from the 1878 mark, a service worker that caches the shell, and iOS `apple-touch-icon` / `apple-mobile-web-app-capable` tags.

### Cloudflare (`https://tatel.app`)

`wrangler.jsonc` deploys the export as a Workers static-asset site named `tatel`. A path with no file serves `index.html`. `public/_headers` is copied into `dist/` and sets `Cache-Control: no-cache` on `/sw.js` and `/manifest.webmanifest`, and a one-year immutable cache on the hashed `/_expo/*` and `/assets/*` files.

Workers static assets ignore `Range` and return the whole file. `worker/index.ts` runs first for `/api/*` and `*.mp4`. An MP4 range comes back as `206` with `Content-Range`. Each of those requests reads the file in the worker. `white-bay.mp4` is about 14 MB, under the 25 MiB asset limit.

`GET /api/program` fetches the published program file, checks that the body parses as JSON, and returns `Content-Type: application/json` with `Cache-Control: public, max-age=300, stale-while-revalidate=86400`. The Cache API keeps the last good copy through that stale window. If the upstream fails, the route returns the cached copy, or `502` when there is none.

```bash
npm run build:web
npm run deploy
```

`build:web` is the web export plus the PWA tags. `deploy` runs that build, then `wrangler deploy`. The machine that deploys needs `npx wrangler login`. This repo has no Cloudflare token, and a checkout does not publish the site.

VIP group reminders use the cron in `wrangler.jsonc` (`17 * * * *`). That schedule takes effect only with `wrangler deploy` or `wrangler triggers deploy`. The Stripe webhook `https://tatel.app/api/stripe/webhook` needs `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`.

`POST /api/quick-signin` signs in an allowlisted email with no code. The worker proxies to the Lovable Cloud edge function `tatel-quick-signin` at `https://oykwxnzlpxbrfcoejawt.supabase.co/functions/v1/tatel-quick-signin`. That function holds the allowlist (`sansara13@gmail.com` and `jamerosg@gmail.com`) and mints the session. The worker does not need a Supabase service role key. `SUPABASE_URL` is already in `wrangler.jsonc`. Anyone who types an allowlisted address receives that account’s session. Every other address still gets the email code.

Chat profiles add `bio` and `link` on `community_profiles` and reuse the `community-media` bucket. Apply `supabase/migrations/20261113_community_profile_bio.sql` in the SQL editor after `supabase/community.sql`. This repo does not apply it.

The manifest `id`, `start_url`, and `scope` are `https://tatel.app/`. Icon and service-worker paths stay root-relative, so they resolve on that origin.

Attach the apex after the first deploy. The zone `tatel.app` is already on the account:

1. Open Workers & Pages, then the `tatel` worker.
2. Settings → Domains & Routes → Add Custom Domain.
3. Enter `tatel.app`. Cloudflare adds the DNS record in that zone.

Netlify (`netlify.toml`) and Vercel (`vercel.json`) can still build the same `dist/` folder. The apex host is the Cloudflare worker.

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
- Each session stays on its island accommodations stop. The specific venue is still “to be confirmed.” The session lists that island’s candidate places.
- Emerald Beach Resort and Gallows Point Resort are marked as app additions. They are not in the website Accommodations list.
- Place galleries live in `public/venues` as 640 and 1280 WebP plus a JPEG fallback, loaded lazily. Margaritaville IMG_2654–IMG_2659 stay in the gallery and are not used as the hero.
- The Emerald Beach page shows two Draco-compressed scans, not the sample triangle.
- Panelist profiles use a portrait when the file is present.
- Sample transport, accommodations, the pass preview, the on-device guide, opt-in local notes, and Delete my data are still here.

## What is real, and what is still unconfirmed

From the website export:

- 205 sessions (200 core, 5 supplementary) and 48 panelists
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
public          manifest, service worker, beacon video, sample glTF, _headers
worker          MP4 byte ranges for the Cloudflare deploy
wrangler.jsonc  Workers static assets, project name tatel
scripts/generate-tatel-content.mjs
scripts/finalize-pwa.mjs
```
