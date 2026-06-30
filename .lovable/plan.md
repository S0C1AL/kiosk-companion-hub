# Plan

## 1. Persist screen rotation + touch calibration across reboots

The two `xrandr` / `xinput` commands need to run **inside the X session** after the touch device exists, so the right place is `~/.xinitrc` (runs once X starts, before Chromium). Adding them to `/boot/firmware/config.txt` with `display_hdmi_rotate=1` would rotate the framebuffer but breaks the touch matrix; keeping it as an X-level rotation matches what you've already calibrated.

Edit `~/.xinitrc` and add **before** the `exec chromium-browser` line:

```bash
# Rotate display 90° clockwise (portrait)
xrandr --output HDMI-1 --rotate right || true

# Recalibrate ILITEK touch panel for rotated orientation
# (retry briefly because the device can appear a beat after X starts)
for i in 1 2 3 4 5; do
  if xinput list --name-only | grep -q "ILITEK ILITEK-TP"; then
    xinput set-prop "ILITEK ILITEK-TP" "Coordinate Transformation Matrix" \
      0 1 0 -1 0 1 0 0 1
    break
  fi
  sleep 1
done
```

No `DISPLAY=` / `XAUTHORITY=` prefix needed inside `.xinitrc` — they're already set by the X session.

## 2. Player Info — single-column portrait layout

The screen is now portrait (1080×1920). The current `lg:grid-cols-2` puts both cards side-by-side which forces them tiny and wastes the bottom half.

Changes to `src/routes/player-info.index.tsx`:

- Drop the 2-col grid → vertical stack (`flex flex-col gap-6`).
- **Order:** Personal info card on top, Balance card below.
- Bump scale: avatar `size-32`, name `text-3xl`, row text `text-lg`, balance "Hotovost" `text-5xl`, secondary balance rows `text-3xl`. Increase padding to `p-8` and gap between rows to `space-y-4`.
- Promote the level badge into a bigger pill next to the name.
- Add a **third card below balance** to fill remaining space: "Member since" / "Card #" / "Currency" / a brief loyalty-tier explainer pulled from i18n (`playerInfo.tierInfo`) — purely cosmetic, no new API calls.

## 3. Self-Exclusion — single-column portrait layout

Changes to `src/routes/panic-button.index.tsx`:

- Drop `lg:grid-cols-[1fr_1.4fr]` → vertical stack: PlayerSummaryCard on top, then the two action buttons stacked, then a new **"Responsible gaming"** info card filling the bottom with helpline number + short text (i18n key `panic.responsibleGaming`).
- Make ActionCards taller (`p-8`, icon `size-16`, title `text-3xl`, desc `text-xl`) so they read well from a distance.
- Keep the existing 48h-already-done success banner behavior.

## 4. Fix laggy PDF scrolling

Chromium's built-in PDF viewer renders pages on the CPU with the iframe sandbox, which is what's stuttering on the CM4. The robust kiosk fix is to **pre-rasterize each PDF to JPEG pages once at deploy time** and display them as a plain scroll of `<img>` tags. Native image scrolling is GPU-composited and silky on the Pi.

### Deploy-time step (one-off on the Pi)

Add `scripts/render-pdfs.sh` to the repo:

```bash
#!/bin/bash
# Rasterize every PDF in /etc/kiosk/game-plans/ to JPEGs.
# Requires: sudo apt install -y poppler-utils
set -e
SRC=/etc/kiosk/game-plans
OUT=/etc/kiosk/game-plans-rendered
mkdir -p "$OUT"
for pdf in "$SRC"/*.pdf; do
  name=$(basename "$pdf" .pdf)
  dir="$OUT/$name"
  mkdir -p "$dir"
  pdftoppm -jpeg -r 110 -jpegopt quality=82 "$pdf" "$dir/page" || true
  # Write a manifest so the app knows how many pages exist
  ls "$dir"/page-*.jpg 2>/dev/null | sort | xargs -n1 basename > "$dir/pages.txt"
done
chown -R jkriha:jkriha "$OUT"
```

Run once: `sudo apt install -y poppler-utils && bash scripts/render-pdfs.sh` (re-run any time PDFs are replaced — takes ~10 s).

### Server route

Add `src/routes/game-plans-img.$.ts` — same pattern as the existing `game-plans.$.ts` PDF streamer, but serves files from `/etc/kiosk/game-plans-rendered/...` with long `Cache-Control` and proper `image/jpeg` mime.

Add `src/routes/api/kiosk.game-plan-pages.ts` — `GET ?type=technical&lang=de` returns the `pages.txt` manifest as JSON `{ pages: ["page-01.jpg", ...] }`.

### Viewer

Rewrite `src/routes/game-plan.$type.tsx`:

- Fetch the manifest via TanStack Query.
- Render a vertically-scrolling container of `<img loading="lazy" decoding="async" src="/game-plans-img/{type}.{lang}/page-XX.jpg">`.
- Keep the existing fallback message when the manifest is empty.
- Keep `idleMs={300_000}`.

This removes the entire Chromium PDF subsystem from the hot path: smooth touch-scroll, no toolbar, no right-click menu, no "save as".

## Technical notes

- `KioskShell` and `CardGate` stay unchanged.
- No API/business-logic changes; layout + new static-image route only.
- New i18n keys to add to `cz.json`, `en.json`, `de.json`:
  - `playerInfo.tierInfo`
  - `panic.responsibleGaming` (multiline helpline text)

## Deploy steps (after I make the code changes)

```bash
cd ~/kiosk-app
git pull
NITRO_PRESET=node-server bun run build

# One-time on the Pi
sudo apt install -y poppler-utils
bash scripts/render-pdfs.sh

# Append rotation/touch lines to ~/.xinitrc (see step 1)
nano ~/.xinitrc

sudo systemctl restart kiosk-app
sudo reboot
```

After reboot: rotation + touch survive, both info pages fill the screen, PDFs scroll smoothly.
