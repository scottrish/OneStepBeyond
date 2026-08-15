import type { ReactNode } from "react";

// Ported from ../OneStepBeyondPrototype/src/components/efc/AppShell.tsx.
type EmptyStateProps = {
  title: string;
  hint: string;
  action?: ReactNode;
};

export default function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
