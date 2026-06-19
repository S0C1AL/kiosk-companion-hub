
## Goal

A fullscreen, touch-first kiosk web app running in Chromium on a Raspberry Pi CM4. Home screen with tiles, ACR122 card reader for identification, DOB verification, and integration with the local Player API. 3 languages (cz/en/de), per-card detection, default `de`.

## Tech stack

- TanStack Start (already in template), React, TypeScript, Tailwind, shadcn/ui.
- `react-i18next` for translations.
- `react-pdf` (PDF.js) to render bundled Game Plan PDFs with touch pan/zoom.
- Server functions (`createServerFn`) as a thin proxy to the Player API so the kiosk browser doesn't need CORS access and the baseIP stays server-side.
- Config: `/boot/kiosk-config.json` on the Pi → read once at server startup, exposed via a server fn.
  ```json
  {
    "baseIP": "192.168.1.50",
    "casinoId": "ABCD",
    "readPort": 2012,
    "writePort": 5074
  }
  ```
- No database, no auth backend — fully stateless kiosk.

## API endpoints

- **Read (port 2012)**
  - `GET http://{baseIP}:2012/api/player/info?cardNo={decimal}`
  - `GET http://{baseIP}:2012/api/player/balance?playerId={id}`
- **Write (port 5074)**
  - `POST http://{baseIP}:5074/excludeperson` → `{ playerId, casinoId }`
  - `POST http://{baseIP}:5074/blacklistperson` → `{ playerId, casinoId, sendMail }`

## Routes

```
src/routes/
  __root.tsx              shell, header (language switcher, clock), idle timer
  index.tsx               home tiles (Game Plan, Panic Button, Player Info, [+1 placeholder])
  game-plan.index.tsx     two tiles: Technical, Live
  game-plan.$type.tsx     PDF viewer
  panic-button.index.tsx  card prompt + DOB + actions + "how to" panel
  player-info.index.tsx   card prompt + DOB + info + balance + "how to" panel
```

Panic Button and Player Info share a `<CardGate>` component: wait for card swipe → fetch `/api/player/info` → DOB verification keypad → render children with player context.

## Components

- `TileGrid` / `Tile` — large touch targets, icon + label.
- `LanguageSwitcher` — header dropdown, persists override in localStorage; otherwise auto from `idDocNationality`.
- `CardReaderListener` — global keyboard listener; buffers hex chars until Enter, converts `parseInt(hex, 16)` → decimal cardNo.
- `OnScreenKeypad` — numeric pad for DOB entry, large keys.
- `PdfViewer` — react-pdf with pinch/drag, page nav, zoom.
- `HowToPanel` — collapsible side panel with translated instructions (per page).
- `IdleReset` — after 60s of no touch/no card, navigate `/` and clear session.
- `ConfirmDialog` — for the two exclusion POSTs.

## Card flow

1. Reader in HID/keyboard-wedge mode outputs hex + Enter (e.g. `293A6C3B\n`).
2. Global listener captures, converts to decimal (`parseInt("293A6C3B", 16) === 691694651`).
3. Server fn `getPlayerInfo({ cardNo })` → `GET :2012/api/player/info`.
4. App stores player in React context; routes to DOB gate.
5. DOB gate compares input (DD/MM/YYYY) to `dateOfBirth`. 3 wrong tries → eject to home.
6. Language auto-detected from `document[0].idDocNationality`: `CZE`/`SVK`→cz, `DEU`/`AUT`→de, else en. Header switcher overrides until next card.

## Language

- `react-i18next` with bundles under `src/i18n/{cz,en,de}.json`.
- Default `de` before any card is read.

## Game Plan

- PDFs bundled under `src/assets/game-plans/{technical,live}.{cz,en,de}.pdf` (via `lovable-assets`).
- Routes `/game-plan/technical` and `/game-plan/live` pick PDF by current language with `de` fallback.
- No card required.

## Panic Button

- After card + DOB:
  - Show name, DOB, photo placeholder, casinoId.
  - **48-hour exclusion** → confirm modal → `POST :5074/excludeperson` `{ playerId, casinoId }`.
  - **Permanent exclusion** → confirm modal with **Send email** checkbox → `POST :5074/blacklistperson` `{ playerId, casinoId, sendMail }`.
  - Success → translated confirmation screen, auto-return home after 10s.
- "How to" collapsible panel.

## Player Info

- After card + DOB:
  - Personal info (name, DOB, address, contact, last visit, visit counters, card level).
  - Balance from `GET :2012/api/player/balance?playerId=...`:
    - Currency map `0→EUR`, `49→CZK`.
    - Divide `cardCash`, `cardNonCash`, `cardPoints` by 100, format with currency.
  - "How to" collapsible panel.

## Server functions (`src/lib/player.functions.ts`)

```ts
getKioskConfig()                        // { baseIP, casinoId, readPort, writePort }
getPlayerInfo({ cardNo })               // GET  :readPort /api/player/info
getPlayerBalance({ playerId })          // GET  :readPort /api/player/balance
excludePlayer48h({ playerId })          // POST :writePort /excludeperson
blacklistPlayer({ playerId, sendMail }) // POST :writePort /blacklistperson
```

`baseIP`, `casinoId`, and both ports are read from the config file on the Pi; never trusted from the client.

## Kiosk hardening (frontend)

- `cursor: none`, disable selection/context menu/pinch-to-refresh.
- Lock viewport to display size.
- Idle reset after 60s.
- Error boundary returns to home with a translated "Try again" message.

## Out of scope (Pi-side, you handle)

- Configuring ACR122 in HID mode; Chromium in kiosk mode.
- Auto-start service for the Node server.
- Writing `/boot/kiosk-config.json`.
- Supplying the real PDF files (I'll wire placeholders).

## Assumptions

- Reader emits uppercase hex + Enter.
- DOB entry format: `DD.MM.YYYY` (switcher follows language).
- Idle timeout: 60s.
- 4th home tile: disabled "Coming soon" placeholder.
