// Screen-reader announcements for a sortable list, using row titles —
// never internal ids, which dnd-kit's defaults read out ("Picked up
// draggable item 3f2a…"). docs/features/
// mobile-gestures-reorder-and-swipe-v0.1.md §1.

export type SortRow = {
  id: string;
  title: string;
};

function position(rows: SortRow[], id: string): string {
  return `position ${rows.findIndex((row) => row.id === id) + 1} of ${rows.length}`;
}

function title(rows: SortRow[], id: string): string {
  return rows.find((row) => row.id === id)?.title ?? "Item";
}

export function pickedUp(rows: SortRow[], id: string): string {
  return `Picked up ${title(rows, id)}. ${capitalize(position(rows, id))}.`;
}

export function movedTo(rows: SortRow[], activeId: string, overId: string | undefined): string | undefined {
  if (!overId) return undefined;
  return `${title(rows, activeId)} moved to ${position(rows, overId)}.`;
}

export function droppedAt(rows: SortRow[], activeId: string, overId: string | undefined): string {
  if (!overId) return `${title(rows, activeId)} dropped. Order unchanged.`;
  return `${title(rows, activeId)} dropped at ${position(rows, overId)}.`;
}

export function cancelled(rows: SortRow[], activeId: string): string {
  return `Moving ${title(rows, activeId)} was cancelled. Order unchanged.`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
