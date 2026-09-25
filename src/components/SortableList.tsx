import { useRef, type CSSProperties, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { cancelled, droppedAt, movedTo, pickedUp, type SortRow } from "@/lib/sortAnnouncements";

// A pointer drag starts only after this much movement, so a tap on the
// handle isn't read as a drag.
const DRAG_ACTIVATION_PX = 8;

// Vertical list only (no @dnd-kit/modifiers dependency for one line).
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

type SortableListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  // Only planned sessions can move; the rest keep their place (no handle)
  // but still take up a position in the list.
  isSortable: (item: T) => boolean;
  // Every row id, in the new order. What happens next (re-chaining,
  // saving now or at Confirm) is the list owner's business.
  onReorder: (orderedIds: string[]) => void;
  // `lead` is the row's leading slot: the drag handle for a sortable row,
  // or an empty 44px spacer otherwise, so every row's content lines up.
  // Pass `leadContent` to put something (e.g. a done check) in the spacer.
  renderItem: (item: T, lead: (leadContent?: ReactNode) => ReactNode) => ReactNode;
  className?: string;
};

// Drag to reorder — docs/features/mobile-gestures-reorder-and-swipe-v0.1.md
// §1 and docs/decisions/20260925-session-reorder-and-drag.md. dnd-kit
// provides pointer, touch and keyboard dragging (focus the handle,
// Space/Enter to pick up, arrows to move, Space/Enter to drop, Escape to
// cancel); announcements use row titles. Every list using this must also
// offer Earlier/Later buttons (WCAG 2.2 SC 2.5.7).
export default function SortableList<T>({
  items,
  getId,
  getTitle,
  isSortable,
  onReorder,
  renderItem,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);
  // dnd-kit reports the picked-up row as "over" itself straight away; an
  // announcement for that would overwrite "Picked up …" before a screen
  // reader reads it. Only announce when the target actually changes.
  const lastOverId = useRef<string | null>(null);
  const rows: SortRow[] = items.map((item) => ({ id: getId(item), title: getTitle(item) }));

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => {
            lastOverId.current = String(active.id);
            return pickedUp(rows, String(active.id));
          },
          onDragOver: ({ active, over }) => {
            const overId = over ? String(over.id) : null;
            if (overId === lastOverId.current) return undefined;
            lastOverId.current = overId;
            return movedTo(rows, String(active.id), overId ?? undefined);
          },
          onDragEnd: ({ active, over }) =>
            droppedAt(rows, String(active.id), over ? String(over.id) : undefined),
          onDragCancel: ({ active }) => cancelled(rows, String(active.id)),
        },
        screenReaderInstructions: {
          draggable:
            "To reorder, press Space or Enter to pick up, use the arrow keys to move, " +
            "then Space or Enter to drop. Press Escape to cancel.",
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cn("flex flex-col gap-2", className)}>
          {items.map((item) => (
            <SortableRow
              key={getId(item)}
              id={getId(item)}
              title={getTitle(item)}
              sortable={isSortable(item)}
            >
              {(lead) => renderItem(item, lead)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

type SortableRowProps = {
  id: string;
  title: string;
  sortable: boolean;
  children: (lead: (leadContent?: ReactNode) => ReactNode) => ReactNode;
};

function SortableRow({ id, title, sortable, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: { draggable: !sortable, droppable: false } });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const lead = (leadContent?: ReactNode) =>
    sortable ? (
      <button
        type="button"
        ref={setActivatorNodeRef}
        data-drag-handle
        aria-label={`Drag to reorder ${title}`}
        {...attributes}
        {...listeners}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring active:cursor-grabbing"
      >
        <GripVertical aria-hidden="true" className="size-5" />
      </button>
    ) : (
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center">
        {leadContent}
      </span>
    );

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-10 opacity-80 shadow-lg")}
    >
      {children(lead)}
    </li>
  );
}
