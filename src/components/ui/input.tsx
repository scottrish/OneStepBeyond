import * as React from "react";

import { cn } from "@/lib/utils";

// Ported from ../OneStepBeyondPrototype/src/components/ui/input.tsx. 48px
// tall on phones, 44px from sm:, with 16px text at every width — the
// prototype's (and shadcn's) md:text-sm drops below 16px, which makes iOS
// Safari zoom the page on focus. See docs/features/
// mobile-app-shell-and-touch-ergonomics-v0.1.md §5.
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-11",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
