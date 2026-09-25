import {
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SWIPE_ACTION_WIDTH,
  canStartSwipe,
  detectIntent,
  dragOffset,
  settleOffset,
  type SwipeIntent,
} from "@/lib/swipeGesture";
import { SwipeRowContext } from "./swipeRowContext";

type SwipeActionRowProps = {
  // Unique across the app (e.g. "assignment-<id>") — the one-open-at-a-
  // time coordinator keys on it.
  id: string;
  // The row's own name, used in the action's accessible name.
  label: string;
  // "Delete", "Remove", … — must match the row's visible non-gesture route.
  actionLabel: string;
  // Runs exactly what that non-gesture route runs, including any
  // confirmation. The row closes first, so a confirmation never renders
  // shifted sideways.
  onAction: () => void;
  children: ReactNode;
  // Match the row's own corner radius so the revealed action is clipped
  // to the same shape (e.g. "rounded-lg", "rounded-2xl").
  className?: string;
  disabled?: boolean;
};

type Gesture = {
  x: number;
  y: number;
  base: number;
  intent: SwipeIntent;
};

// Swipe left to *reveal* a destructive action — never to perform it.
// docs/features/mobile-gestures-reorder-and-swipe-v0.1.md §2:
// - vertical movement is left to the browser (touch-action: pan-y), and a
//   gesture only becomes a swipe once it's clearly horizontal;
// - never starts from a text field, drag handle, or popup trigger
//   (swipeGesture.ts's canStartSwipe);
// - a drag that ends over a button inside the row doesn't click it;
// - tapping an open row just closes it (including over a menu trigger,
//   which Radix opens on pointerdown, hence the capture-phase guard);
// - only one row is open app-wide (SwipeRowProvider), falling back to
//   local state when rendered without one (e.g. isolated tests);
// - the action is a pointer-only affordance: aria-hidden and out of the
//   tab order while closed. Keyboard and screen-reader users use each
//   list's visible non-gesture route (overflow menu or button) instead.
export default function SwipeActionRow({
  id,
  label,
  actionLabel,
  onAction,
  children,
  className,
  disabled = false,
}: SwipeActionRowProps) {
  const context = useContext(SwipeRowContext);
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const openId = context ? context.openId : localOpenId;
  const setOpenId = context ? context.setOpenId : setLocalOpenId;
  const open = openId === id;

  // Live offset while a finger is down; null when at rest (then the offset
  // is derived from `open`). Mirrored in a ref so pointerup reads the
  // latest value without waiting for a re-render.
  const [liveOffset, setLiveOffset] = useState<number | null>(null);
  const liveOffsetRef = useRef<number | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const swallowNextClick = useRef(false);

  // Reset to closed when the row goes away (navigation, deletion).
  useEffect(() => {
    return () => setOpenId((current) => (current === id ? null : current));
  }, [id, setOpenId]);

  function setLive(offset: number | null) {
    liveOffsetRef.current = offset;
    setLiveOffset(offset);
  }

  function swallowClick() {
    swallowNextClick.current = true;
    // The click (if any) is dispatched right after pointerup, in the same
    // task; clear the flag afterwards so a later genuine tap still works.
    window.setTimeout(() => {
      swallowNextClick.current = false;
    }, 0);
  }

  function handlePointerDownCapture(event: PointerEvent<HTMLDivElement>) {
    // An open row's content is inert: a tap only closes it. Menu triggers
    // act on pointerdown, so they must be stopped here, before they open.
    if (open && event.target instanceof Element && event.target.closest("[aria-haspopup]")) {
      event.preventDefault();
      event.stopPropagation();
      setOpenId(null);
      swallowClick();
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!canStartSwipe(event.target)) return;
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      base: open ? -SWIPE_ACTION_WIDTH : 0,
      intent: "undecided",
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;

    if (current.intent === "undecided") {
      current.intent = detectIntent(dx, dy);
      if (current.intent === "vertical") {
        gesture.current = null; // a scroll — leave it to the browser
        return;
      }
      if (current.intent === "undecided") return;
      // Now a swipe: keep receiving moves even if the finger leaves the
      // row, and close whichever other row was open.
      event.currentTarget.setPointerCapture?.(event.pointerId);
      if (openId !== null && openId !== id) setOpenId(null);
    }

    setLive(dragOffset(current.base, dx));
  }

  function handlePointerEnd() {
    const current = gesture.current;
    gesture.current = null;
    if (!current || current.intent !== "horizontal") return;

    const settled = settleOffset(liveOffsetRef.current ?? current.base);
    setLive(null);
    if (settled !== 0) setOpenId(id);
    else if (open) setOpenId(null);
    swallowClick();
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    // The click a browser dispatches right after a swipe's pointerup is
    // part of the swipe, not a tap: swallow it without closing the row the
    // swipe just opened.
    if (swallowNextClick.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // A genuine tap on an open row's content only closes it.
    if (open) {
      event.preventDefault();
      event.stopPropagation();
      setOpenId(null);
    }
  }

  function handleActionKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") setOpenId(null);
  }

  if (disabled) return <div className={className}>{children}</div>;

  const offset = liveOffset ?? (open ? -SWIPE_ACTION_WIDTH : 0);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <button
        type="button"
        aria-label={`${actionLabel} ${label}`}
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={() => {
          setOpenId(null);
          onAction();
        }}
        onKeyDown={handleActionKeyDown}
        style={{ width: SWIPE_ACTION_WIDTH }}
        className="absolute inset-y-0 right-0 flex cursor-pointer items-center justify-center gap-2 bg-destructive px-3 text-sm font-medium text-destructive-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <Trash2 aria-hidden="true" className="size-4" /> {actionLabel}
      </button>
      <div
        data-swipe-content
        onPointerDownCapture={handlePointerDownCapture}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={handleClickCapture}
        style={{ transform: `translateX(${offset}px)` }}
        className={cn(
          "relative touch-pan-y bg-background",
          liveOffset === null && "transition-transform duration-200 ease-out",
        )}
      >
        {children}
      </div>
    </div>
  );
}
