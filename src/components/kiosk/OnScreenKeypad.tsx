import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onKey: (key: string) => void;
  onBackspace: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

export function OnScreenKeypad({ onKey, onBackspace }: Props) {
  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-3">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          className={cn(
            "h-20 rounded-2xl bg-white/10 text-3xl font-semibold text-white",
            "border border-white/10 backdrop-blur transition active:scale-95 hover:bg-white/20",
          )}
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        onClick={onBackspace}
        className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition active:scale-95 hover:bg-white/20"
        aria-label="Backspace"
      >
        <Delete className="size-7" />
      </button>
    </div>
  );
}