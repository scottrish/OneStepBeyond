import { cva } from "class-variance-authority";

// Split out of button.tsx: exporting a non-component value alongside the
// Button component trips eslint-plugin-react-refresh's
// only-export-components rule, since it breaks Fast Refresh for that file.
export const buttonVariants = cva(
  // Focus ring: 3px at the ring token's full opacity. The prototype's
  // ring-ring/40 fails WCAG 1.4.11 (1.75:1 on the light background) — see
  // docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §5.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Every size clears CLAUDE.md's 44×44px touch-target minimum
      // (WCAG 2.5.5) at every breakpoint — docs/features/
      // mobile-app-shell-and-touch-ergonomics-v0.1.md §5. Deliberately does
      // not copy the prototype's sm: shrink (default→40px, sm→36px):
      // tablets are touch devices too. min-h rather than h so a caller that
      // opts into whitespace-normal can wrap onto a second line.
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-11 rounded-md px-3 text-xs",
        lg: "min-h-12 rounded-md px-6 sm:px-8",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
