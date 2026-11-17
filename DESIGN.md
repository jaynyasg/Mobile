# TATEL design system

## Product context

TATEL is an installable mobile web app for a Virgin Islands summit. It welcomes first-time guests, helps them arrange a ticket and accommodation, guides them to useful sessions, and introduces the people and island experiences around the event.

The experience should feel glamorous, sexy, exciting, fun, and adventurous while making its purpose and practical decisions easy to understand. The invitation is **Make waves. Make it matter.**

## Approved direction

Keep the current coastal, cinematic direction: existing TATEL photography and short films, deep navy, translucent glass, gold accents, Bodoni Moda, and Manrope. Use clearer hierarchy, generous spacing, and direct language within that identity.

The user chose existing TATEL imagery as the source and then explicitly said, “i would like to keep the current direction.” The consultation's Golden hour, After dark, and Island light alternatives are not the approved design. The proposed four-destination navigation is not part of this release.

## Typography

Use the locally loaded families in `src/theme.ts` and the variants in `src/components/Text.tsx`.

| Role | Family | Size / line height |
| --- | --- | --- |
| Display | Bodoni Moda Semibold | 42 / 46 |
| Chapter title | Bodoni Moda Semibold | 32 / 36 |
| Section heading | Manrope Semibold | 24 / 28 |
| Body | Manrope Regular | 17 / 24 |
| Supporting copy | Manrope Medium | 16 / 22 |
| Metadata | Manrope Medium | 15 / 21 |
| Eyebrow | Manrope Semibold | 12 / 16 |
| Button | Manrope Medium | 15 / 20 |
| Row title | Manrope Semibold | 17 / 22 |

The Home invitation uses 40 / 44. Existing narrow-screen overrides may reduce display headings; body copy must remain readable and allow enlargement. Meaningful text wraps without truncation. Use the sans serif for prices, times, forms, and longer descriptions. Code typography is not part of the guest experience.

## Color and surfaces

`src/theme.ts` owns the shared palette. `src/components/nightGlass.ts` owns glass and scrim treatment.

| Token | Value | Purpose |
| --- | --- | --- |
| stage / pineDeep | #071421 | Deep navy foundation |
| ink / pine | #0B1B2B | Navy text on light controls and surfaces |
| foam | #F5F1E8 | Primary text on dark surfaces |
| ivory | #F7F4EF | Warm light accent |
| muted | #D5DEE3 | Secondary light tone |
| gold | #FFE08A | Primary actions and selected states |
| brassSoft | #C9A24A | Supporting gold accent |
| turquoise / clay | #0E7490 | Blue accent |
| paper | #F4F7F8 | Light surface |
| night glass | rgba(7,27,42,0.58) | Translucent navy panels |

Keep gold controls paired with dark text. Text over photography needs the existing local scrim and readable contrast across the image. Glass is supported by a visible background color when blur is unavailable. Error and success states must include clear text and cannot rely on color alone. Do not introduce a replacement light/dark palette as part of routine copy or flow work.

## Spacing and layout

Use the existing 16-pixel page gutter and padding token. Common gaps follow a 4-pixel rhythm: 4, 8, 12, 16, 20, 24, 32. Editorial features can use more space; compact controls must retain usable touch targets.

The app uses a fluid, primarily single-column phone layout. Existing cards use 16–18-pixel corners, the dock uses 22, and editorial image features can use 8. Buttons generally have pill-shaped corners. Preserve the existing responsive composition rather than imposing a new desktop grid or width cap.

Keep the current two-row dock: Home, Sessions, Explore, Tickets, Me, Chat, Panelists, Prep guide, Routes, and Stays. `dockClearance()` reserves space for the dock and home indicator. Every screen's last line and action must remain reachable. Dialogs appear above the dock and scroll on short phones. Account for Safari browser chrome, standalone mode, safe areas, and larger text.

## Imagery and motion

Use the existing TATEL coast, venue, community, and session assets. Preserve faces and important scenery in crops. Photography should communicate the setting and social energy without implying that an unconfirmed venue or independent activity is included in a ticket.

Retain the short section films and their existing transitions. Provide pause, skip, back/next, and still-image fallbacks. Respect reduced motion, autoplay restrictions, and data-saving preferences. Copy must remain readable independently of video timing; do not introduce required motion or unsolicited audio.

## Voice and guided journey

Lead with the invitation, then give a concrete action. Explain TATEL's purpose, the five infrastructure areas, the Virgin Islands setting, and how guests can contribute. Pair the vacation with meaningful work without adding unsupported promises.

The journey is ticket → accommodation → saved sessions → Explore. Skip arrangements the guest already has. Opening a page does not complete a step. When the questions identify a ticket, open that ticket's checkout directly (the required booking form for Board). Guests who have not chosen a ticket see the catalog. Within the catalog, present ticket choices before the next-step action. Clearly distinguish Beach, Boat, and the five-day Board stay; explain ferries, local transfers, accommodation, and inclusions.

Require valid name, email, phone, and boat preference before Board booking. A group link is not a purchase, and a saved session is not a reserved seat. Session discovery connects infrastructure → sub-infrastructure → goal to the real program. Introduce panelists, chat, island activities, and stamps through clear, reachable actions.

Ask for infrastructure and sub-infrastructure in the opening questions. Use those saved answers to put matching island options and session cards at the top of Accommodations and Sessions. Keep choice editing and optional goal refinement available without repeating the questionnaire on entry. Show booking guidance and next-step actions after the options.

When guests choose several infrastructure areas, combine their sub-infrastructure options. Show shared fields once and label every matching selected area. Adding an area preserves existing choices; removing one only clears fields that no longer belong to any selected area.

Present the opening summary as the guest's plan based on their choices. Name the suggested ticket once in its numbered step. After verified payment, briefly confirm success and automatically continue to the next unfinished step. Offer an explicit booking-later action inside checkout and Board booking; it continues the plan without recording a purchase. Back and Close still let guests review or change their ticket.

## Verification

The CEO content update keeps this visual system and all current panelists, films, and background assets. Introduce the Technology Mill and CFEG Learning Labs, the connected four-day method, eight island needs, the daily overview, and the Virgin Islands story before the three entry choices. Keep St. Croix in the wider destination story only. Replace the former Jost Van Dyke program location with near Tortola, without inventing a dock or moving real hotels. Preserve existing sessions on other islands.

Provider windows follow the booking website: embed where supported, show a readable overview and external fallback otherwise, and only record accommodation after the guest explicitly confirms a reservation. The work notebook stores private notes on the current device and offers an export; it does not imply a shared project backend or automatic annual reminders.

Use the existing typecheck, tests, guided-visit browser checks, and readability sweep when changes affect their coverage. Check phone layouts at 320×568 and 390×844, larger text, and browser/standalone behavior. iPhone installation instructions must explain Safari's Add to Home Screen flow; an actual device is needed to verify the final operating-system action.

## Decisions

| Date | Decision | Basis |
| --- | --- | --- |
| 2026-11-16 | Use existing TATEL imagery and agreed mood | Explicit user selection; no competitor research |
| 2026-11-16 | Keep the current visual direction | Explicit user response to the visual consultation |
| 2026-11-16 | Retain current navigation, palette, and typography | Documented from the implementation rather than adopting the alternative proposals |
| 2026-11-16 | Complete the guided flow and readability improvements | Original user requirements; verified implementation in commit 200ffae |
