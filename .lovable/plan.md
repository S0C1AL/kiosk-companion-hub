## Goal
Replace Chromium's default pointer with a custom 40px accent-colored circle that follows the finger/mouse and briefly expands on tap.

## Plan

### 1. CSS — hide system cursor
- Add `cursor: none` to `html, body` in `src/styles.css`.
- Keep `cursor: auto` (or `text`) on `input, textarea` so users can still see where they are typing.

### 2. CustomCursor component (`src/components/kiosk/CustomCursor.tsx`)
- Renders a single fixed-position `<div>` (the cursor dot).
- **Size:** 40px diameter.
- **Color:** uses the app's `--color-accent` CSS variable (via inline `backgroundColor: var(--color-accent)`).
- **Shape:** `border-radius: 50%`, subtle `box-shadow` glow for visibility on dark backgrounds.
- **Movement:** listens to `pointermove` on `window`, updates `left/top` via `transform: translate(...)` for 60fps performance.
- **Tap animation:** on `pointerdown` scales the circle up to ~1.6× with a short CSS transition; on `pointerup` scales back to 1×.
- **Touch support:** on touch devices the circle appears at the tap point, plays the expand animation, then fades out after ~300ms so it doesn't stay stuck on screen.

### 3. Global mount
- Import and render `<CustomCursor />` inside `RootComponent` in `src/routes/__root.tsx`, above `<Outlet />`, so it is present on every route.

### 4. Z-index & visibility
- Cursor layer sits above everything (`z-index: 9999`) but uses `pointer-events: none` so it never blocks clicks on buttons or links.

### 5. Optional config exposure (future-proof)
- If desired later, cursor color/size could be driven from `kiosk-config.json` by reading `levelColors` or adding a new `cursorColor` key. Not in scope unless requested.

## Result
No default arrow anywhere in the kiosk. A smooth accent-colored dot follows the pointer, giving a tactile "expand on press" feel for every tap.