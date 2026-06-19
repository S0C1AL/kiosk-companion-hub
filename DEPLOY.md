# Casino Kiosk — Raspberry Pi Deployment

End-to-end setup for a fresh Raspberry Pi running the kiosk app, the PC/SC
card bridge, and the ACR122U NFC reader.

Tested with: Raspberry Pi OS (Bookworm, 64-bit), Node.js 20, Python 3.11.

---

## 1. System packages

```bash
sudo apt-get update
sudo apt-get install -y \
    nodejs npm \
    pcscd pcsc-tools libpcsclite-dev \
    python3 python3-pip python3-requests \
    git curl
```

Confirm `node -v` is >= 20. If not, install from NodeSource.

Install `pyscard` (the PC/SC Python binding):

```bash
pip3 install --break-system-packages pyscard
```

Install Bun (used for the build step only):

```bash
curl -fsSL https://bun.sh/install | bash
# add ~/.bun/bin to PATH if your shell didn't already
```

## 2. Enable the smart-card daemon at boot

```bash
sudo systemctl enable --now pcscd
systemctl status pcscd --no-pager
```

Verify the reader is detected (Ctrl+C to exit):

```bash
pcsc_scan
# Expect: "Reader 0: ACS ACR122U 00 00"
```

## 3. Clone & build the kiosk app

```bash
cd ~
git clone <your-repo-url> kiosk-app
cd kiosk-app
bun install
NITRO_PRESET=node-server bun run build
```

You should now see:

```
.output/server/index.mjs        <- Node HTTP server entry
.output/public/                 <- static assets
```

## 4. Drop in the game-plan PDFs

The app loads PDFs from disk via the `/game-plans/*` route, in this order:

1. `$KIOSK_GAME_PLANS_DIR` (if set)
2. `/etc/kiosk/game-plans/`
3. `/boot/kiosk-game-plans/`
4. `<app>/.output/public/game-plans/`
5. `<app>/public/game-plans/`

Pick **one** location and put the files there. Recommended:

```bash
sudo mkdir -p /etc/kiosk/game-plans
sudo cp /path/to/*.pdf /etc/kiosk/game-plans/
# expected filenames: technical.de.pdf  technical.en.pdf  technical.cz.pdf
#                     live.de.pdf       live.en.pdf       live.cz.pdf
```

No rebuild is required when you swap PDFs.

## 5. App systemd service

Create `/etc/systemd/system/kiosk-app.service`:

```ini
[Unit]
Description=Casino Kiosk App
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=jkriha
WorkingDirectory=/home/jkriha/kiosk-app
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=0.0.0.0
# Environment=KIOSK_GAME_PLANS_DIR=/etc/kiosk/game-plans
# Environment=KIOSK_BRIDGE_SECRET=change-me
ExecStart=/usr/bin/node /home/jkriha/kiosk-app/.output/server/index.mjs
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kiosk-app
sudo systemctl status kiosk-app --no-pager
```

Smoke tests:

```bash
curl -I http://127.0.0.1:3000/                                  # 200
curl -I http://127.0.0.1:3000/game-plans/technical.de.pdf       # 200, application/pdf
```

## 6. Card bridge systemd service

The bridge watches `pcscd` and POSTs insert/remove events to the app. The app
then pushes them to the browser via Server-Sent Events at `/api/card/stream`,
so the session opens when a card is presented and closes the moment it's
removed — no keyboard wedge required.

Install the unit:

```bash
sudo cp /home/jkriha/kiosk-app/scripts/kiosk-card-bridge.service \
        /etc/systemd/system/kiosk-card-bridge.service
sudo systemctl daemon-reload
sudo systemctl enable --now kiosk-card-bridge
journalctl -u kiosk-card-bridge -f
```

Tap a card on the reader — you should see `INSERT uid=...` and then `REMOVE`
lines in the journal. The browser will react in real time.

If you set `KIOSK_BRIDGE_SECRET`, set the **same value** in both
`/etc/systemd/system/kiosk-app.service` and
`/etc/systemd/system/kiosk-card-bridge.service`, then restart both.

## 7. Chromium kiosk autostart (optional)

On the desktop session, launch Chromium pointed at the app:

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars \
    --incognito http://127.0.0.1:3000
```

## 8. Updating the app

```bash
cd ~/kiosk-app
git pull
bun install
NITRO_PRESET=node-server bun run build
sudo systemctl restart kiosk-app
```

The card bridge does not need to be rebuilt or restarted on app updates.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `pcsc_scan` shows no readers | `pcscd` not running | `sudo systemctl enable --now pcscd` |
| Card tap does nothing in browser | bridge not running, or app secret mismatch | `journalctl -u kiosk-card-bridge -n 50` |
| Session doesn't close on card removal | browser tab lost SSE connection | reload the kiosk tab; check `journalctl -u kiosk-app` |
| `/game-plans/*.pdf` returns 404 | PDF not in any candidate directory | drop into `/etc/kiosk/game-plans/` |
| `kiosk-app.service` exits with status=1 | `ExecStart` points at wrong file | must be `.output/server/index.mjs`, not `dist/server/server.js` |