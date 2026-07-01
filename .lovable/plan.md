## Changes

### 1. Rename "Self-Exclusion" → "Panic Button" everywhere
- `src/i18n/{cz,en,de}.json`:
  - `home.tiles.panicButton`: "Panic Button" / "Panic Button" / "Panic Button" (keep same in all — it's a recognizable term; CZ tile desc kept as "48 hodin nebo trvale")
  - `panic.title`: change from "Sebevyloučení" / "Self-Exclusion" / "Selbstsperre" → "Panic Button" (all three)
- `src/routes/panic-button.index.tsx`: update `<title>` head meta → `"Panic Button — Casino Kiosk"`.
- Home tile already reads `home.tiles.panicButton`, so it picks it up automatically.

### 2. Show player email on the Panic Button page (Both places)
- **Summary card** (`PlayerSummaryCard` in `panic-button.index.tsx`): add an Email row below DOB. If missing, render greyed-out placeholder text (new i18n key `panic.noEmail` → "No email on file — add it at reception").
- **Perm-exclusion confirmation modal**: repeat the email (or the no-email notice) directly above the "Send confirmation by email" checkbox for clarity.

### 3. Handle "Send confirmation by email" when no email exists
Chosen approach: **disable the checkbox with a note.**
- If `!player.email`: render checkbox as `disabled`, forced `checked={false}`, with a small warning line underneath: `panic.noEmailWarning` → "No email on file. Please add or update your email at reception to receive an email confirmation."
- If email exists: current behavior unchanged.

### 4. Replace responsible-gaming text at the bottom
- Replace `panic.responsibleGaming` in all three languages with the new long-form text (CZ verbatim from the message; EN + DE auto-translated).
- Keep `panic.responsibleGamingTitle` but rebrand: CZ "Zodpovědné hraní a pomoc", EN "Responsible Gaming & Help", DE "Verantwortungsvolles Spielen & Hilfe".
- The bottom section already uses `whitespace-pre-line`, so newlines and bullets (`Ø`, `o`, `a)/b)`) render correctly. Institutions/phones/emails/URLs stay identical across all languages (only intro sentences translated).
- Add short intro line about 18+ / harmful gambling at the top of the block (from provided CZ text: "Hazardní hry se nesmí účastnit osoby mladší 18 let. Účast na hazardní hře může být škodlivá.").

### 5. Use `primaryLevelColour` from API, drop level colour config
- `src/routes/player-info.index.tsx`: remove `cfgQuery` + `levelColors` lookup; use `player.primaryLevelColour || "#475569"` directly. Removes one server round-trip and keeps colours in sync with the source system automatically.
- `src/lib/kiosk-config.server.ts` + `getKioskClientConfig`: leave the `levelColors` field in place but stop reading it from the client (harmless if kept in config; simply unused). No breaking change to config file.
- Verify `player.primaryLevelColour` is typed on `PlayerInfo` in `src/lib/player-types.ts` (per earlier context it is; will double-check while implementing).

## Files touched
- `src/i18n/cz.json`, `src/i18n/en.json`, `src/i18n/de.json` — text changes + 3 new keys (`panic.noEmail`, `panic.noEmailWarning`, updated `panic.responsibleGaming*`).
- `src/routes/panic-button.index.tsx` — email row in summary + in perm modal, disabled-checkbox logic, title change.
- `src/routes/player-info.index.tsx` — drop config lookup, use `primaryLevelColour`.

## Not changed
- No backend/API changes, no config file changes, no new dependencies.
- Deploy story unchanged — just `git pull && NITRO_PRESET=node-server bun run build && sudo systemctl restart kiosk-app`.