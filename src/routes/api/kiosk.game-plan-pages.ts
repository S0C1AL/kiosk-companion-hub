import { createFileRoute } from "@tanstack/react-router";
import fs from "node:fs";
import path from "node:path";

const CANDIDATE_DIRS = [
  process.env.KIOSK_GAME_PLANS_RENDERED_DIR,
  "/etc/kiosk/game-plans-rendered",
  "/boot/kiosk-game-plans-rendered",
  path.resolve(process.cwd(), ".output/public/game-plans-rendered"),
  path.resolve(process.cwd(), "public/game-plans-rendered"),
].filter(Boolean) as string[];

const SAFE = /^[a-zA-Z0-9._-]+$/;

function findPlanDir(plan: string): string | null {
  if (!SAFE.test(plan)) return null;
  for (const dir of CANDIDATE_DIRS) {
    const full = path.join(dir, plan);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) return full;
  }
  return null;
}

export const Route = createFileRoute("/api/kiosk/game-plan-pages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get("type") ?? "";
        const lang = url.searchParams.get("lang") ?? "";
        const plan = `${type}.${lang}`;
        const dir = findPlanDir(plan);
        if (!dir) return Response.json({ ok: false, pages: [] }, { status: 200 });

        let pages: string[] = [];
        const manifest = path.join(dir, "pages.txt");
        if (fs.existsSync(manifest)) {
          pages = fs
            .readFileSync(manifest, "utf8")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          pages = fs
            .readdirSync(dir)
            .filter((f) => /^page-\d+\.(jpe?g|png)$/i.test(f))
            .sort();
        }
        return Response.json({ ok: true, plan, pages });
      },
    },
  },
});