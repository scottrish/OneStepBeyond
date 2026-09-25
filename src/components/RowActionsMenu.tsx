import type { ComponentType } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RowAction = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onSelect: () => void;
  destructive?: boolean;
};

type RowActionsMenuProps = {
  // Accessible name for the trigger — include the row, e.g.
  // "Actions for Chapter 7 problem set".
  label: string;
  actions: RowAction[];
  className?: string;
};

// The visible, non-gesture route to a list row's actions: a 44px "···"
// trigger and a menu of 44px items. Every swipe-to-reveal row
// (SwipeActionRow) pairs with one of these — or another visible button —
// so its action never *requires* a gesture (WCAG 2.5.1; docs/features/
// mobile-gestures-reorder-and-swipe-v0.1.md §2), and it's the only route
// keyboard and screen-reader users get. Takes a list so later rows can
// add non-destructive actions (e.g. Earlier/Later) to the same menu.
export default function RowActionsMenu({ label, actions, className }: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={label} variant="ghost" size="icon" className={cn("shrink-0 rounded-full", className)}>
          <MoreHorizontal className="size-5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl p-1">
        {actions.map(({ label: actionLabel, icon: Icon, onSelect, destructive }) => (
          <DropdownMenuItem
            key={actionLabel}
            className={cn("min-h-11 rounded-lg", destructive && "text-destructive focus:text-destructive")}
            onSelect={onSelect}
          >
            {Icon ? <Icon className="size-4" /> : null} {actionLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
