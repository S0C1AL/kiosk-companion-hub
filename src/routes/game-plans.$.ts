import { createFileRoute } from "@tanstack/react-router";
import fs from "node:fs";
import path from "node:path";

// Serve game-plan PDFs from disk. This avoids any reliance on the runtime's
// static asset handler so plans can be dropped onto the kiosk without a rebuild.
// Configurable via KIOSK_GAME_PLANS_DIR; otherwise tries a list of sane defaults.
const CANDIDATE_DIRS = [
  process.env.KIOSK_GAME_PLANS_DIR,
  "/etc/kiosk/game-plans",
  "/boot/kiosk-game-plans",
  path.resolve(process.cwd(), ".output/public/game-plans"),
  path.resolve(process.cwd(), "dist/public/game-plans"),
  path.resolve(process.cwd(), "public/game-plans"),
].filter(Boolean) as string[];

function resolveFile(rel: string): string | null {
  if (!/^[a-zA-Z0-9._-]+$/.test(rel)) return null; // no slashes, no traversal
  for (const dir of CANDIDATE_DIRS) {
    const full = path.join(dir, rel);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

export const Route = createFileRoute("/game-plans/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rel = (params._splat ?? "").trim();
        const file = rel ? resolveFile(rel) : null;
        if (!file) return new Response("Not found", { status: 404 });
        const buf = fs.readFileSync(file);
        // Convert Buffer to a fresh Uint8Array (Response wants BodyInit-compatible bytes).
        const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength).slice();
        return new Response(bytes, {
          status: 200,
          headers: {
            "content-type": file.endsWith(".pdf") ? "application/pdf" : "application/octet-stream",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});