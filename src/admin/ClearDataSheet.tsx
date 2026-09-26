import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ResponsiveSheet from "@/components/ResponsiveSheet";
import ErrorBanner from "../components/ErrorBanner";
import {
  CLEAR_CATEGORIES,
  emailConfirmed,
  isAllCategories,
  removalLines,
  type ClearCategory,
} from "../domain/adminClearing";
import { useClearPreview } from "./useClearPreview";

type ClearDataSheetProps = {
  open: boolean;
  userId: string;
  email: string;
  categories: ClearCategory[];
  // "Also turn off this account" is offered only for an account that's on,
  // and never your own (A5, A6).
  canAlsoTurnOff: boolean;
  busy: boolean;
  onConfirm: (alsoDisable: boolean) => void;
  onClose: () => void;
};

// The confirmation for clearing (docs/features/admin-account-management-
// v0.1.md, A7): what will be removed, with counts; for "All data", typing
// the account's email, and the one-step "Also turn off this account" (A5).
export default function ClearDataSheet(props: ClearDataSheetProps) {
  return (
    <ResponsiveSheet
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      title={isAllCategories(props.categories) ? "Clear all data?" : "Clear this data?"}
      description={`From ${props.email}. This can’t be undone.`}
    >
      {/* Mounted only while open, so the preview loads each time it opens. */}
      {props.open && <ClearDataBody {...props} />}
    </ResponsiveSheet>
  );
}

function ClearDataBody({ userId, email, categories, canAlsoTurnOff, busy, onConfirm, onClose }: ClearDataSheetProps) {
  const { data: preview, loading, loadError, retry } = useClearPreview(userId, categories);
  const [typedEmail, setTypedEmail] = useState("");
  const [alsoTurnOff, setAlsoTurnOff] = useState(false);
  const all = isAllCategories(categories);
  const lines = removalLines(preview);
  const chosen = CLEAR_CATEGORIES.filter((category) => categories.includes(category.id));

  const ready = !loading && !loadError && !busy && (!all || emailConfirmed(typedEmail, email));
  const confirmLabel = all ? (alsoTurnOff ? "Clear all data and turn off" : "Clear all data") : "Clear";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-sm font-medium">What you chose</p>
        <ul className="list-disc pl-5 text-sm">
          {chosen.map((category) => (
            <li key={category.id}>
              {category.label}
              {category.alsoRemoves && <span className="text-muted-foreground"> — also {category.alsoRemoves}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div aria-live="polite">
        <p className="mb-1 text-sm font-medium">What will be removed</p>
        {loading && <p className="text-sm text-muted-foreground">Counting…</p>}
        {loadError && <ErrorBanner message="Couldn’t work out what would be removed." onRetry={retry} />}
        {!loading && !loadError && (
          lines.length > 0 ? (
            <ul className="list-disc pl-5 text-sm">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">There’s nothing here to clear.</p>
          )
        )}
      </div>

      {all && (
        <div className="flex flex-col gap-2">
          <label htmlFor="confirm-email" className="text-sm font-medium">
            Type <span className="break-all">{email}</span> to confirm
          </label>
          <Input
            id="confirm-email"
            autoComplete="off"
            value={typedEmail}
            onChange={(event) => setTypedEmail(event.target.value)}
          />
          {canAlsoTurnOff && (
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={alsoTurnOff}
                onChange={(event) => setAlsoTurnOff(event.target.checked)}
              />
              Also turn off this account
            </label>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button variant="destructive" className="sm:flex-1" disabled={!ready} onClick={() => onConfirm(all && alsoTurnOff)}>
          {busy ? "Clearing…" : confirmLabel}
        </Button>
        <Button variant="ghost" className="sm:flex-1" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
