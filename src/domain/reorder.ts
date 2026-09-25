// docs/features/manual-work-breakdown-reflection-v0.1.md §4 Step 1:
// "reorder Work Items." The breakdown draft steps use up/down moves only.
// Planned-session lists also use this for Earlier/Later, alongside a
// 44px drag handle (docs/decisions/20260925-session-reorder-and-drag.md).
export function moveItem<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;

  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}
