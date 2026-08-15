import * as React from "react";

import { cn } from "@/lib/utils";

// Ported verbatim from ../OneStepBeyondPrototype/src/components/ui/textarea.tsx
// — no touch-target deviation needed, its 60px min-height already clears
// the 44px minimum (this is a multi-line field, not a single tap target).
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
