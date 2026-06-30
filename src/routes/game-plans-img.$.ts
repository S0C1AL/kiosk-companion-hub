import { createFileRoute } from "@tanstack/react-router";
import fs from "node:fs";
import path from "node:path";

// Serve pre-rasterized game-plan page images. Mirrors game-plans.$.ts
// but reads from a directory of JPEGs produced by scripts/render-pdfs.sh.
const CANDIDATE_DIRS = [
  process.env.KIOSK_GAME_PLANS_RENDERED_DIR,
  "/etc/kiosk/game-plans-rendered",
  "/boot/kiosk-game-plans-rendered",
  path.resolve(process.cwd(), ".output/public/game-plans-rendered"),
  path.resolve(process.cwd(), "public/game-plans-rendered"),
].filter(Boolean) as string[];

// Allows "<plan>/page-XX.jpg" — single slash, no traversal.
const REL_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

function resolveFile(rel: string): string | null {
  if (!REL_RE.test(rel)) return null;
  for (const dir of CANDIDATE_DIRS) {
    const full = path.join(dir, rel);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

export const Route = createFileRoute("/game-plans-img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rel = (params._splat ?? "").trim();
        const file = rel ? resolveFile(rel) : null;
        if (!file) return new Response("Not found", { status: 404 });
        const buf = fs.readFileSync(file);
        const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength).slice();
        const ext = path.extname(file).toLowerCase();
        const ct =
          ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".png"
              ? "image/png"
              : "application/octet-stream";
        return new Response(bytes, {
          status: 200,
          headers: {
            "content-type": ct,
            "cache-control": "public, max-age=86400, immutable",
          },
        });
      },
    },
  },
});