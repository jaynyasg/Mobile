# TATEL · Conversations

A mobile preview of the TATEL Conversations draft for January 26–29, 2027, across the Virgin Islands. The program, portraits, scenes, route maps, stays, and pass copy come from the TATELprep export. They are drafts. Speakers, times, venues, transport, and pass prices are labeled the way the source labels them.

The app is Expo SDK 58 with React Native and TypeScript. One codebase runs on Android, iOS, and in a browser. Expo Go can load it without a native build.

## Shared program data

Public content lives in [`src/content/tatel.json`](src/content/tatel.json). [`src/content/index.ts`](src/content/index.ts) is plain TypeScript with no React Native imports, so a website can import the same module or read the JSON.

Regenerate it from an extracted TATELprep tree (the repo paths `public/`, `docs/`, and the image files). Do not edit the JSON by hand.

```bash
TATEL_SOURCE=/path/to/extracted-tatelprep npm run generate
```

The default source path is `/tmp/tatel-src`. The script copies the portraits, eight scenes, twelve route-map PNGs, the 1878 mark, and the Ilma deck-plan page images into `assets/tatel/`. It does not resize those files. The app icon is a separate navy plate made so Expo has a square icon; the original `1878-logo-dark.png` is unchanged in `assets/tatel/`.

Bodoni Moda and Manrope are bundled in `assets/fonts/` under the SIL Open Font License. The license texts sit next to the files.

## Run it

```bash
npm install
npm run typecheck
npm test
npm run web
```

Expo serves the app at `http://localhost:8081`. The page centers a phone-width column.

### On an Android phone

1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from the Play Store. This project uses Expo SDK 58, so Expo Go needs to support that SDK.
2. Connect the phone and the computer to the same Wi-Fi.
3. From this directory:

   ```bash
   npm start
   ```

4. Open Expo Go and scan the QR code in the terminal. On Android, the in-app scanner is more reliable than the camera app.
5. The project loads in Expo Go. Edits on the computer refresh the phone.

If the phone cannot see the computer:

```bash
npx expo start --tunnel
```

With an emulator or a device on `adb`, `npm run android` opens the project in Expo Go. `npm run ios` needs macOS.

## What you can do

Bottom tabs: **Home**, **Agenda**, **Panelists**, **Network**, **More**.

- Agenda filters by day, pillar, island, type (featured, circuit, or regular), and panelist, and it searches titles and names. Favorites become My Schedule.
- Every session shows Atlantic time. When the phone is in another zone, it also shows that clock. Status stays **Proposed**. Venues stay unconfirmed.
- Featured names are potential contributors, not assigned speakers. Regular names are suggested panelists, with the source roles for lead and contributor.
- Panelist profiles use the original portraits and link to proposed sessions. A proposed pillar is the first linked draft session, not a booking.
- Island pages cover the five planning homes: Tech / St. Thomas, AI / St. John, Travel / Scrub Island, Entertainment / Jost Van Dyke, and Law / Lovango.
- Sample transport has the powerboat, ferry, and yacht agendas, the route-map PNGs, and the Sentinel-2 and OpenStreetMap credits.
- Accommodations list the providers from brochure pages 21–22. The Ritz-Carlton, St. Thomas entry opens the supplied deck-plan page images because the original PDF was not in the export.
- The pass screen is a design preview. The QR code is not a ticket, and no payment is collected.
- The guide answers from the on-device draft. Settings includes **Delete my data**.
- Network is an on-device opt-in for local notes. Notes are not sent, and the roster is not a confirmed opt-in directory.

## What is real, and what is draft or mocked

Taken from the source, and still unconfirmed there:

- 200 proposed sessions, 29 panelists, five pillars, four phases, and the draft notice
- Featured candidates kept separate from regular speaker suggestions
- Three sample transportation agendas, route-map PNGs, and imagery credits
- Accommodation names and links from brochure pages 21–22
- Pass names and preview prices, with the source’s “no payment” label

Real in the app:

- Navigation, filters, search, favorites, and Atlantic versus local clocks
- Portrait, scene, map, and deck-plan rendering of the copied files
- The on-device guide over `src/content`
- Opt-in gating for local notes
- Deletion of the on-device store

Mocked, on purpose:

- No server, accounts, push, or checkout
- Local notes are not delivered and are not written as if a panelist replied
- The pass QR is a preview payload, not a credential
- Notifications are the source’s own draft sentences, not push messages

## Project layout

```
src/content     generated program JSON and the typed module
src/logic       filters, clocks, guide, and the personal-data reducer
src/app         Expo Router screens
assets/tatel    portraits, scenes, route maps, logo, deck pages
assets/fonts    Bodoni Moda and Manrope
scripts/generate-tatel-content.mjs
```
