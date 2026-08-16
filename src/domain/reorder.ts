// docs/features/manual-work-breakdown-reflection-v0.1.md §4 Step 1:
// "reorder Work Items." Up/down move rather than drag-and-drop, per
// CLAUDE.md's mobile-first guidance against small precise drag handles.
export function moveItem<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;

  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}
