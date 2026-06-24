## What's going on

Looking at the photo: the display is sitting physically in landscape, but the kiosk content is rendered sideways and only fills roughly the left half. The app's CSS already uses full-viewport layout (`min-h-screen`, grid tiles, no fixed landscape widths), so this is **not** a code issue — the operating system is rotating the framebuffer to 1080×1920, but the physical panel is still scanning out as 1920×1080. The result is a tall portrait image squeezed into a landscape panel.

In short: `xrandr --rotate left` only rotates what X11 draws. It does **not** physically rotate a Waveshare HDMI panel. The panel itself has no orientation awareness — it always displays 1920×1080 the way HDMI delivers it.

## Plan

Step-by-step diagnostics for you to run on the Pi and paste back. Once we know what's actually configured, the fix is one of two things (KMS rotation, or simply mounting the display in portrait and letting xrandr do its job correctly).

### Step 1 — Confirm what Chromium currently sees

In the Chromium window on the Pi, press `Ctrl+Shift+I` to open DevTools (or SSH in and run):

```bash
DISPLAY=:0 XAUTHORITY=/home/jkriha/.Xauthority xrandr --verbose | head -40
```

Then in DevTools Console:

```js
window.innerWidth + " x " + window.innerHeight
screen.width + " x " + screen.height
```

Paste both outputs.

### Step 2 — Decide the rotation layer

There are three places rotation can happen, and they conflict if you mix them:

1. **KMS / firmware** (`/boot/firmware/cmdline.txt` → `video=HDMI-A-1:1080x1920@60,rotate=90`) — rotates the framebuffer at the kernel level. **This is what you want for a kiosk** because Chromium, the mouse, and the touch input all agree on coordinates from boot.
2. **xrandr `--rotate left`** — only rotates X11 output. Touch input does **not** rotate with it unless you also run a `xinput` coordinate-transformation-matrix command. This is the source of most "content is sideways and squeezed" symptoms.
3. **Physically rotating the panel** — required regardless, because the LCD itself isn't rotatable.

### Step 3 — Fix (KMS rotation, recommended)

Once Step 1 confirms the current state, the fix is typically:

```bash
sudo nano /boot/firmware/cmdline.txt
# add at the end of the single line:
video=HDMI-A-1:1080x1920M@60,rotate=90

sudo nano /boot/firmware/config.txt
# ensure these are present (and no display_rotate= override):
hdmi_group=2
hdmi_mode=87
hdmi_cvt=1080 1920 60 6 0 0 0
hdmi_drive=2

# remove any old xrandr rotate from autostart:
nano ~/.config/lxsession/LXDE-pi/autostart   # or wherever you put it

sudo reboot
```

After reboot, Chromium will come up in 1080×1920 natively, fullscreen, with touch coordinates correct. Then physically rotate the panel so the short side is at the bottom.

### Step 4 — Verify

After reboot, re-run the two commands from Step 1. You should see `1080 x 1920` for both `xrandr` and `window.innerWidth/innerHeight`. Tap a tile to confirm touch coordinates also rotated.

## What I will not change in the app

No code changes are needed for portrait support — the layout is already responsive. If after Step 4 the tiles look stretched or awkward in portrait (e.g. 2×2 grid feels too tall), we can then add portrait-specific tweaks (single column, larger tiles, repositioned header). But let's confirm rotation works first before touching CSS.

## What I need from you

Paste back the outputs from Step 1, plus the contents of `/boot/firmware/cmdline.txt` and `/boot/firmware/config.txt`, and I'll give you the exact lines to change.
