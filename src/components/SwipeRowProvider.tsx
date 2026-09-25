import { useMemo, useState, type ReactNode } from "react";
import { SwipeRowContext } from "./swipeRowContext";

// Mounted once in App.tsx, above every tab and overlay, so "only one row
// open at a time" holds across the whole student app.
export default function SwipeRowProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const value = useMemo(() => ({ openId, setOpenId }), [openId]);
  return <SwipeRowContext.Provider value={value}>{children}</SwipeRowContext.Provider>;
}
