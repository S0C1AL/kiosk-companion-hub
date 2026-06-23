import { memo } from "react";
import { Delete } from "lucide-react";

interface Props {
  onKey: (key: string) => void;
  onBackspace: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

// Pointer events fire ~300ms sooner than synthetic click on touch screens,
// and skipping backdrop-blur / hover transitions keeps the keypad cheap to
// repaint on low-power kiosk hardware.
const BTN =
  "h-20 rounded-2xl bg-white/10 text-3xl font-semibold text-white border border-white/10 select-none touch-manipulation active:bg-white/25";

function KeypadImpl({ onKey, onBackspace }: Props) {
  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-3">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onKey(k);
          }}
          className={BTN}
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onBackspace();
        }}
        className={`${BTN} flex items-center justify-center`}
        aria-label="Backspace"
      >
        <Delete className="size-7" />
      </button>
    </div>
  );
}

export const OnScreenKeypad = memo(KeypadImpl);