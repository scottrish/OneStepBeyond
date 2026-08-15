import EmptyState from "@/components/EmptyState";

// Placeholder tab content — docs/features/daily-planning.md isn't built
// yet. See docs/Roadmap.md's Phase 1 nav-shell entry: "no content yet."
export default function PlanPage() {
  return (
    <main className="p-8">
      <h1 className="mb-4 text-3xl">Plan</h1>
      <EmptyState
        title="Planning is coming soon"
        hint="You'll be able to build a daily plan here in a future update."
      />
    </main>
  );
}
