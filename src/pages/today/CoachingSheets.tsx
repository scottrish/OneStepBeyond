import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ResponsiveSheet from "@/components/ResponsiveSheet";
import {
  frictionOptions,
  type ExecutionStage,
  type FrictionKind,
  type Intervention,
  type InterventionAction,
} from "../../domain/executionCoaching";
import { timeLabel } from "../../domain/planningDate";

// Today Execution's coaching sheets (execution-coaching-v0.1.md,
// "Presentation"): a bottom sheet on phones, a dialog from sm:. Every
// option is a full-width, 48px-tall button whose text wraps. Closing a
// sheet any other way (swipe, backdrop, Escape, ✕) is its cancel — and
// for the intervention sheet, that counts as "Not helpful right now".

const OPTION =
  "min-h-12 w-full justify-start whitespace-normal rounded-2xl py-3 text-left leading-snug";

export function FrictionSheet({
  stage,
  onChoose,
  onClose,
}: {
  stage: ExecutionStage | null;
  onChoose: (kind: FrictionKind) => void;
  onClose: () => void;
}) {
  return (
    <ResponsiveSheet
      open={stage !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="What's getting in the way?"
      description="Choose the closest answer. You can change the plan next."
    >
      <div className="flex flex-col gap-2">
        {stage &&
          frictionOptions(stage).map((option) => (
            <Button key={option.kind} variant="outline" className={OPTION} onClick={() => onChoose(option.kind)}>
              {option.label}
            </Button>
          ))}
        <Button variant="ghost" className={OPTION} onClick={onClose}>
          Never mind
        </Button>
      </div>
    </ResponsiveSheet>
  );
}

export function InterventionSheet({
  intervention,
  onAction,
  onDismiss,
}: {
  intervention: Intervention | null;
  onAction: (action: InterventionAction) => void;
  // "Not helpful right now", or closing the sheet any other way.
  onDismiss: () => void;
}) {
  return (
    <ResponsiveSheet
      open={intervention !== null}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      title={intervention?.headline ?? ""}
      {...(intervention ? { description: intervention.body } : {})}
    >
      <div className="flex flex-col gap-2">
        {intervention?.actions.map((action) => (
          <Button key={action.id} variant="outline" className={OPTION} onClick={() => onAction(action)}>
            {action.label}
          </Button>
        ))}
        <Button variant="ghost" className={OPTION} onClick={onDismiss}>
          Not helpful right now
        </Button>
      </div>
    </ResponsiveSheet>
  );
}

export function OwnActionSheet({
  open,
  prompt,
  onSave,
  onSkip,
}: {
  open: boolean;
  // Set for "Note what's in the way"; otherwise it's the first step.
  prompt: string | undefined;
  onSave: (text: string) => void;
  onSkip: () => void;
}) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onSkip();
      }}
      title={prompt ? "What's in the way?" : "What comes first?"}
      description={prompt ? "Put it in your own words, if you like." : "Name one small action in your own words."}
    >
      {/* Remounted each time it opens, so the field starts empty. */}
      {open && <OwnActionForm prompt={prompt} onSave={onSave} onSkip={onSkip} />}
    </ResponsiveSheet>
  );
}

function OwnActionForm({
  prompt,
  onSave,
  onSkip,
}: {
  prompt: string | undefined;
  onSave: (text: string) => void;
  onSkip: () => void;
}) {
  const [text, setText] = useState("");
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(text.trim());
      }}
    >
      <Label htmlFor="own-action">{prompt ?? "In your own words — what comes first?"}</Label>
      <Textarea id="own-action" value={text} onChange={(event) => setText(event.target.value)} rows={3} />
      <Button type="submit" className={OPTION} disabled={text.trim() === ""}>
        {prompt ? "Save" : "That's my first step"}
      </Button>
      <Button type="button" variant="ghost" className={OPTION} onClick={onSkip}>
        Skip
      </Button>
    </form>
  );
}

export function RepairSheet({
  open,
  dueTodayOrEarlier,
  dueBeforeTomorrow,
  laterTodayAt,
  onLaterToday,
  onTomorrow,
  onAnotherDay,
  onCancel,
}: {
  open: boolean;
  dueTodayOrEarlier: boolean;
  dueBeforeTomorrow: boolean;
  // The next free start today, or null when nothing fits (then not offered).
  laterTodayAt: string | null;
  onLaterToday: () => void;
  onTomorrow: () => void;
  onAnotherDay: () => void;
  onCancel: () => void;
}) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title="When would you rather do this?"
    >
      {dueTodayOrEarlier && (
        <p className="mb-3 text-sm text-foreground">Worth knowing: this is due today.</p>
      )}
      <div className="flex flex-col gap-2">
        {laterTodayAt && (
          <Button variant="outline" className={OPTION} onClick={onLaterToday}>
            Later today · {timeLabel(laterTodayAt)}
          </Button>
        )}
        <Button
          variant="outline"
          className={OPTION}
          onClick={onTomorrow}
          aria-describedby={dueBeforeTomorrow ? "repair-tomorrow-hint" : undefined}
        >
          Tomorrow
        </Button>
        {dueBeforeTomorrow && (
          <p id="repair-tomorrow-hint" className="-mt-1 px-1 text-xs text-muted-foreground">
            This is due before then — you can still choose it.
          </p>
        )}
        <Button variant="outline" className={OPTION} onClick={onAnotherDay}>
          Choose another day
        </Button>
        <Button variant="ghost" className={OPTION} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
