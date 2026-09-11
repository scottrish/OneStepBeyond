import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ErrorBanner from "../components/ErrorBanner";
import { EFFORT_PRESETS } from "../domain/effortPresets";
import type { Assignment, AssignmentEdit } from "../services/assignmentService";

type AssignmentDetailEditFormProps = {
  assignment: Assignment;
  actionError: string | null;
  onSave: (patch: AssignmentEdit) => void;
  onCancel: () => void;
};

// docs/decisions/20260912-page-complexity-reduction-proposal.md increment
// 2 — Assignment Detail's edit form, split out of AssignmentDetailPage.tsx.
// Owns its own draft field state, seeded from `assignment` at mount —
// same "local until submitted" pattern AssignmentDetailSteps already
// uses for its own add/edit fields. `onSave` reports the finished patch;
// whether that closes the form (by unmounting this component) stays the
// caller's call, since it also owns whether the update actually
// succeeded.
export default function AssignmentDetailEditForm({
  assignment,
  actionError,
  onSave,
  onCancel,
}: AssignmentDetailEditFormProps) {
  const [title, setTitle] = useState(assignment.title);
  const [dueDate, setDueDate] = useState(assignment.dueDate);
  const [effortMinutes, setEffortMinutes] = useState(assignment.effortMinutes);
  const [notes, setNotes] = useState(assignment.notes ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (title.trim() === "") return;
    onSave({ title, dueDate, effortMinutes, notes });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-title">What is it?</Label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-due">Due</Label>
        <Input
          id="edit-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div>
        <span className="mb-1.5 block text-sm font-medium">Estimated time</span>
        <div role="radiogroup" aria-label="Estimated time" className="flex flex-wrap gap-2">
          {EFFORT_PRESETS.map((preset) => (
            <Button
              key={preset.minutes}
              type="button"
              role="radio"
              aria-checked={effortMinutes === preset.minutes}
              variant={effortMinutes === preset.minutes ? "default" : "outline"}
              onClick={() => setEffortMinutes(preset.minutes)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-notes">Notes (optional)</Label>
        <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {actionError && <ErrorBanner message={actionError} />}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={title.trim() === ""} className="flex-1">
          Save
        </Button>
      </div>
    </form>
  );
}
