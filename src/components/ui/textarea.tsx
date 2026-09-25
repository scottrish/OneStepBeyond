import * as React from "react";

import { cn } from "@/lib/utils";

// Ported from ../OneStepBeyondPrototype/src/components/ui/textarea.tsx.
// 96px minimum height and 16px text at every width (no md:text-sm, which
// triggers iOS zoom-on-focus) — docs/features/
// mobile-app-shell-and-touch-ergonomics-v0.1.md §5.
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-3 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
