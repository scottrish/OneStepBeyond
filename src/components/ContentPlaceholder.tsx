// While a screen's data loads for the first time this session (instant
// screens, docs/features/instant-screen-data-v0.1.md, I2): quiet shapes
// where the content will be, instead of a blank area. The shapes are
// decorative and hidden from screen readers; the area is marked busy and
// says "Loading…" to them once. Later visits render from the app's
// last-known copy and never show this.
export default function ContentPlaceholder({ blocks = 3 }: { blocks?: number }) {
  return (
    <div aria-busy="true" className="mt-4">
      <p className="sr-only">Loading…</p>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="h-28 rounded-3xl border border-border bg-muted" />
        {Array.from({ length: blocks - 1 }, (_, i) => (
          <div key={i} className="h-14 rounded-2xl border border-border bg-muted" />
        ))}
      </div>
    </div>
  );
}
