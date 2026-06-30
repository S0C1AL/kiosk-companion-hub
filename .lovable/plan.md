## Why it's slow

The upstream API is fast (135 ms total). The lag is the browser repainting on the Pi's GPU. Two things compound:

1. **`backdrop-blur` everywhere** — every keypress re-renders the CardGate, which forces Chromium to redo a full-screen Gaussian blur of the card panels behind it. On the CM4 with the default software compositor this alone can cost 800–1500 ms per frame.
2. **`CustomCursor` calls `setState` on every `pointermove`** — re-rendering React on every move starves the event loop while you're trying to register taps. The animated cursor itself is fine; the React re-render isn't.

A smaller third factor: the rotating spinners (`animate-spin`, `animate-pulse`) keep the compositor busy even when nothing is happening, and Chromium currently has no GPU acceleration flags so all of this runs on the CPU.

## Plan

### Code (frontend only, no API/business-logic changes)

1. **Strip `backdrop-blur`** from kiosk surfaces — replace with a plain semi-opaque background (`bg-white/10` etc. already there, just drop the `backdrop-blur` class). Files: `player-info.index.tsx`, `panic-button.index.tsx`, `HowToPanel.tsx`, `KioskHeader.tsx`, `LanguageSwitcher.tsx`.
2. **Make `CustomCursor` render-free** — move all updates to direct DOM writes on a ref, drop `useState`. Use `rAF` to throttle to one paint per frame. Net effect: zero React re-renders from pointer activity.
3. **Remove `transition hover:scale-*` / `active:scale-*`** from the home tiles, Game Plan tiles, and Panic action cards — hover doesn't exist on a touchscreen, and the transforms force layer promotion + repaint on every press.
4. **Keep spinners** but only render them when actually loading (already the case); no change needed there.

### Chromium launch flags (`~/.xinitrc`)

Add GPU acceleration so what remains is composited on the VideoCore instead of the CPU:

```
--ignore-gpu-blocklist
--enable-gpu-rasterization
--enable-zero-copy
--enable-features=VaapiVideoDecoder,CanvasOopRasterization
--use-gl=egl
--disable-features=UseChromeOSDirectVideoDecoder
```

### Pi config (`/boot/firmware/config.txt`)

Confirm `dtoverlay=vc4-kms-v3d` is present and bump `gpu_mem=128` (CM4 default is 76, too low for full-HD compositing). One-line change.

### What I'll deliver

- Edited frontend files listed above.
- An updated `~/.xinitrc` snippet and `/boot/firmware/config.txt` snippet to apply on the Pi.
- Step-by-step deploy: pull, rebuild (`NITRO_PRESET=node-server bun run build`), update `.xinitrc`, edit `config.txt`, reboot.

Expected result: keypad taps register in <100 ms, idle CPU drops noticeably, screen still looks the same minus the (barely visible at 1080p) blur behind the cards.
