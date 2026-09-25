import { createContext, type Dispatch, type SetStateAction } from "react";

// Which SwipeActionRow (if any) is currently swiped open, app-wide — only
// one may be open at a time (docs/features/
// mobile-gestures-reorder-and-swipe-v0.1.md §2). Replaces the prototype's
// window CustomEvent broadcast with plain React state. Split from
// SwipeRowProvider.tsx because exporting a non-component alongside a
// component trips eslint-plugin-react-refresh (see button-variants.ts).
export type SwipeRowContextValue = {
  openId: string | null;
  setOpenId: Dispatch<SetStateAction<string | null>>;
};

export const SwipeRowContext = createContext<SwipeRowContextValue | null>(null);
