import type { ReactNode } from "react";
import { KioskHeader } from "./KioskHeader";
import { IdleReset } from "./IdleReset";

export function KioskShell({
  title,
  children,
  actions,
  idleMs,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  idleMs?: number;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <IdleReset timeoutMs={idleMs} />
      <KioskHeader />
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 px-8 pb-2">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <div className="flex items-center gap-3">{actions}</div>
        </div>
      )}
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}