import type { ReactNode } from "react";

// Ported from ../OneStepBeyondPrototype/src/components/dashboard/shell.tsx
// per docs/features/coach-parent-dashboard-feature-spec-v0.1.md's
// Implementation Note — same design tokens this app already has, so this
// is close to verbatim. Presentational only; no mode/data logic here.

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      {title ? (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

type Tone = "neutral" | "positive" | "attention" | "evidence" | "inference";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  positive: "bg-accent text-accent-foreground",
  attention: "bg-attention text-attention-foreground",
  evidence: "bg-secondary text-secondary-foreground",
  inference: "border border-dashed border-border bg-transparent text-muted-foreground",
};

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${toneClass[tone]}`}>
      {children}
    </span>
  );
}

export function EvidenceLabel({ kind }: { kind: "observed" | "inferred" }) {
  return kind === "observed" ? (
    <Tag tone="evidence">Observed</Tag>
  ) : (
    <Tag tone="inference">Inferred</Tag>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{children}</code>;
}
