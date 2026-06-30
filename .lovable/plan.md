## What I need from the Pi first

Your previous command failed because it was pasted as one long command starting with `bash sudo ...`. Paste this block exactly into SSH; it creates a small diagnostic script and runs it:

```bash
cat > /tmp/kiosk-diagnose.sh <<'EOF'
#!/bin/bash
set +e

echo '--- INSTALL HELPERS ---'
sudo apt update
sudo apt install -y x11-utils xdotool wmctrl

echo '--- ROOT WINDOW ---'
DISPLAY=:0 xwininfo -root | grep -E 'Width|Height|geometry'

echo '--- CHROMIUM WINDOW GEOMETRY ---'
DISPLAY=:0 xdotool search --onlyvisible --class chromium getwindowgeometry %@ 2>/dev/null || true
DISPLAY=:0 xdotool search --onlyvisible --class Chromium getwindowgeometry %@ 2>/dev/null || true
DISPLAY=:0 wmctrl -lG 2>/dev/null || true

echo '--- SCREEN MODES ---'
DISPLAY=:0 xrandr -q

echo '--- CHROMIUM PROCESS ---'
ps aux | grep -E 'chrom(e|ium)' | grep -v grep

echo '--- STARTUP FILES ---'
echo '### ~/.xinitrc'
cat ~/.xinitrc 2>/dev/null || true
echo '### autostart'
cat ~/.config/lxsession/LXDE-pi/autostart 2>/dev/null || true

echo '--- SERVICES ---'
systemctl status kiosk-browser --no-pager 2>/dev/null || true
systemctl --user status kiosk-browser --no-pager 2>/dev/null || true
EOF

bash /tmp/kiosk-diagnose.sh
```

Send me the full output. The important lines are:

- `ROOT WINDOW` should be `1920 x 1080`
- `CHROMIUM WINDOW GEOMETRY` will show whether Chromium is actually opening at half size
- `CHROMIUM PROCESS` shows the exact flags currently used
- `STARTUP FILES` shows which file is launching Chromium

## Likely fix after that output

If the root window is `1920x1080` but Chromium geometry is smaller, I will give you a replacement startup file that:

1. Forces HDMI to `1920x1080` using `xrandr`.
2. Disables screen blanking/power saving.
3. Starts a minimal window manager if needed.
4. Deletes Chromium’s stale window/session state.
5. Launches Chromium with explicit kiosk/fullscreen/window-size flags.
6. Uses `xdotool`/`wmctrl` after launch to force the browser window to `1920x1080` even if Chromium ignores the first flags.

The replacement will look roughly like this, but I want your diagnostic output before you apply it so I target the correct startup file:

```bash
#!/bin/bash
xset s off
xset -dpms
xset s noblank
xrandr --output HDMI-1 --mode 1920x1080 --primary
rm -rf ~/.config/chromium/Singleton* ~/.config/chromium/Default/Current\ Session ~/.config/chromium/Default/Current\ Tabs
chromium-browser \
  --kiosk \
  --start-fullscreen \
  --window-position=0,0 \
  --window-size=1920,1080 \
  --force-device-scale-factor=1 \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --incognito \
  http://127.0.0.1:3000 &
sleep 5
DISPLAY=:0 xdotool search --onlyvisible --class chromium windowsize %@ 1920 1080 windowmove %@ 0 0
DISPLAY=:0 wmctrl -r Chromium -b add,fullscreen
wait
```

## Step-by-step application once confirmed

After you paste the diagnostic output, I’ll reply with the exact file to edit, most likely one of these:

- `~/.xinitrc`
- `~/.config/lxsession/LXDE-pi/autostart`
- `/etc/systemd/system/kiosk-browser.service`

Then the steps will be:

1. Back up the current startup file.
2. Replace it with the corrected fullscreen launch script.
3. Reload systemd if a service is involved.
4. Reboot the Pi.
5. Verify with `xwininfo`, `xdotool`, and a browser viewport check.

This is not an app-code issue anymore if the whole Chromium window is half-screen; it is the Pi desktop/X startup launching Chromium with the wrong window geometry.