import { cva } from "class-variance-authority";

// Split out of button.tsx: exporting a non-component value alongside the
// Button component trips eslint-plugin-react-refresh's
// only-export-components rule, since it breaks Fast Refresh for that file.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
      // "default" and "icon" are bumped from the prototype's h-9 (36px) to
      // h-11 (44px) to satisfy CLAUDE.md's WCAG 2.5.5 touch-target minimum
      // — those are the two sizes this app's screens actually use as real
      // tap targets. "sm"/"lg" are left at the prototype's original values
      // since nothing in this app uses them yet.
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
