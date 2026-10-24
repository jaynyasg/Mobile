# Portico

Portico is a mobile event app for a fictional three-day forum, **Assembly**, held at Harbor Hall in Seattle on November 10–12, 2026. It is an original program: the schedule, people, sponsors, and hall are sample content, not a copy of any live event.

The repo started empty. The app is **Expo SDK 58** with **React Native** and **TypeScript**. One codebase runs on Android, iOS, and in a browser. Expo Go on a phone can load it without a local native build, and Expo Router supplies the tab and stack navigation.

## Shared program data

All public event content lives in [`src/content`](src/content). That folder is plain TypeScript. It does not import React or React Native, so a website can import the same module:

```ts
import { forum, sessions, speakers, sponsors } from "./src/content";
```

Personal data (favorites, seat holds, messages, votes, the profile) lives on the device, in [`src/logic/state.ts`](src/logic/state.ts). Print the program from Node, with no app runtime:

```bash
npm run program
```

## Run it

Install dependencies once:

```bash
npm install
```

Check types and tests:

```bash
npm run typecheck
npm test
```

### In a browser

```bash
npm run web
```

Expo serves the app at `http://localhost:8081`. The page centers a phone-width column. This is the same React Native UI, rendered with React Native Web. It is the fastest way to click through the program on a computer.

### On an Android phone

1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from the Play Store. This project uses Expo SDK 58, so Expo Go needs to support that SDK. The dev server will say so if the installed Expo Go is behind.
2. Connect the phone and the computer to the same Wi-Fi.
3. From this directory, start the dev server:

   ```bash
   npm start
   ```

4. Open Expo Go and scan the QR code printed in the terminal. On Android, the in-app scanner is more reliable than the camera app.
5. The project loads in Expo Go. Edits on the computer refresh the phone.

If the phone cannot see the computer, start a tunnel instead:

```bash
npx expo start --tunnel
```

Expo may install `@expo/ngrok` the first time. Scan the new QR code from Expo Go.

### Android emulator

With an emulator running, or a device connected through `adb`:

```bash
npm run android
```

That is `expo start --android`. It opens the project in Expo Go on the emulator when Expo Go is installed there, or offers a development build.

### iOS

`npm run ios` needs macOS and a simulator. On an iPhone, use Expo Go and the same QR code from `npm start`.

### Deep links

The app scheme is `portico`. In Expo Go or a dev build:

- `portico://session/keynote-attention`
- `portico://speaker/mira-chen`

On the web preview, the same screens are ordinary paths, such as `/session/keynote-attention`.

## What you can do

Bottom tabs: **Home**, **Agenda**, **Speakers**, **Network**, **More**.

- Agenda has day tabs, track filters, search across the three days, favorites, and **Save a seat**. Capacity is a sample baseline plus the seat held on this device. One session is already full.
- Every session shows Pacific time. When the phone is in another zone, it also shows that clock.
- **My Schedule** gathers favorites and seat holds.
- Speakers have a directory and a detail page.
- Network lists only people who opted in. Joining the directory unlocks 1:1 messages and meeting requests. A request that overlaps a keynote is refused, with the session named.
- Sponsors have deals. **Leave my card** stores your name on the device and does not send it.
- **Studio Walk** and **Talent Market** list exhibitors and, for the market, open roles.
- Harbor Hall has a tappable floor plan. **Open the sample pin** hands the coordinates to the platform maps app. The hall and the pin are fictional.
- The badge screen draws a QR code for the sample pass `PA-20481`.
- Notifications are a sample inbox you can mark read.
- Session pages include a poll and a question box. Votes stay on the device.
- The guide answers from the program data on the device. It is not a hosted model.
- **Settings → Delete my data** clears favorites, seats, messages, requests, votes, questions, sponsor cards, guide history, and the profile. The program remains.

## What is real, and what is mocked

Real in the app:

- Navigation, search, filters, favorites, and seat math
- Time zones, via `Intl`
- Opt-in gating for messages and meeting requests
- Keynote overlap checks
- QR rendering of the pass id
- The on-device guide, which retrieves answers from `src/content`
- Deletion of the on-device store

Mocked, on purpose:

- There is no server, account, or push provider. Chat replies are a single scripted line, saved locally.
- Seat counts start from sample numbers. Only this phone's hold changes them.
- "Leave my card" is not delivered to a sponsor.
- The hall map is a schematic. The external pin is a sample on the Seattle waterfront.
- Notifications are written into the program. They are not push messages.
- Polls do not show other people's votes, because there are none.

## Project layout

```
src/content     program data, safe for a website to import
src/logic       time, seats, meetings, agenda, guide, and the personal-data reducer
src/app         Expo Router screens
src/components  shared UI
assets/images   original app icon
```
