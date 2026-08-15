import EmptyState from "@/components/EmptyState";

// Placeholder tab content — docs/features/assignment-management.md isn't
// built yet. See docs/Roadmap.md's Phase 1 nav-shell entry: "no content
// yet." Assignments can still be captured from Home's "+" in the
// meantime (docs/features/assignment-capture.md).
export default function AssignmentsPage() {
  return (
    <main className="p-8">
      <h1 className="mb-4 text-3xl">Assignments</h1>
      <EmptyState
        title="Your assignment list is coming soon"
        hint="For now, you can still capture new assignments from Home."
      />
    </main>
  );
}
